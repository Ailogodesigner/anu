import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, hasRequiredRole } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const search = searchParams.get("search") || "";

  const whereClause: any = {};
  if (category && category !== "ALL") {
    whereClause.category = category;
  }
  if (search) {
    whereClause.OR = [
      { title: { contains: search } },
      { content: { contains: search } },
      { keywords: { contains: search } },
    ];
  }

  const articles = await prisma.knowledgeBaseArticle.findMany({
    where: whereClause,
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ articles });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || !hasRequiredRole(user.role, ["ADMIN", "SUPPORT_LEAD", "SUPPORT_AGENT"])) {
    return NextResponse.json({ error: "Forbidden: Staff role required" }, { status: 403 });
  }

  const body = await req.json();
  const { title, slug, category, content, tags, keywords, isPublished } = body;

  if (!title || !slug || !content) {
    return NextResponse.json({ error: "Title, slug, and content are required" }, { status: 400 });
  }

  const article = await prisma.knowledgeBaseArticle.create({
    data: {
      title,
      slug,
      category: category || "GENERAL",
      content,
      tags: typeof tags === "string" ? tags : JSON.stringify(tags || []),
      keywords: keywords || title.toLowerCase(),
      isPublished: isPublished !== undefined ? isPublished : true,
    },
  });

  await logAuditEvent({
    actorDiscordId: user.discordId,
    actorUsername: user.username,
    action: "KB_ARTICLE_CREATE",
    targetType: "KB_ARTICLE",
    targetId: article.id,
    details: { title: article.title, slug: article.slug },
  });

  return NextResponse.json({ success: true, article });
}
