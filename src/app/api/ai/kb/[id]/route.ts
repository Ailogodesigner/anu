import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, hasRequiredRole } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user || !hasRequiredRole(user.role, ["ADMIN", "SUPPORT_LEAD", "SUPPORT_AGENT"])) {
    return NextResponse.json({ error: "Forbidden: Staff role required" }, { status: 403 });
  }

  const body = await req.json();
  const article = await prisma.knowledgeBaseArticle.update({
    where: { id: params.id },
    data: {
      title: body.title,
      slug: body.slug,
      category: body.category,
      content: body.content,
      tags: typeof body.tags === "string" ? body.tags : JSON.stringify(body.tags || []),
      keywords: body.keywords,
      isPublished: body.isPublished,
    },
  });

  await logAuditEvent({
    actorDiscordId: user.discordId,
    actorUsername: user.username,
    action: "KB_ARTICLE_UPDATE",
    targetType: "KB_ARTICLE",
    targetId: article.id,
    details: { title: article.title },
  });

  return NextResponse.json({ success: true, article });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user || !hasRequiredRole(user.role, ["ADMIN", "SUPPORT_LEAD"])) {
    return NextResponse.json({ error: "Forbidden: Admin or Support Lead required" }, { status: 403 });
  }

  const article = await prisma.knowledgeBaseArticle.delete({
    where: { id: params.id },
  });

  await logAuditEvent({
    actorDiscordId: user.discordId,
    actorUsername: user.username,
    action: "KB_ARTICLE_DELETE",
    targetType: "KB_ARTICLE",
    targetId: params.id,
    details: { title: article.title },
  });

  return NextResponse.json({ success: true });
}
