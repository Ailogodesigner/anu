import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, hasRequiredRole } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const templates = await prisma.embedTemplate.findMany({
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ templates });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || !hasRequiredRole(user.role, ["ADMIN", "SUPPORT_LEAD", "SUPPORT_AGENT"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { name, description, title, embedDescription, color, authorName, footerText, fields, hasTimestamp } = body;

  if (!name) {
    return NextResponse.json({ error: "Template name is required" }, { status: 400 });
  }

  const template = await prisma.embedTemplate.create({
    data: {
      name,
      description: description || null,
      title: title || null,
      embedDescription: embedDescription || null,
      color: color || "#06B6D4",
      authorName: authorName || null,
      footerText: footerText || null,
      fields: typeof fields === "string" ? fields : JSON.stringify(fields || []),
      hasTimestamp: hasTimestamp !== undefined ? hasTimestamp : true,
      createdByDiscordId: user.discordId,
    },
  });

  await logAuditEvent({
    actorDiscordId: user.discordId,
    actorUsername: user.username,
    action: "EMBED_TEMPLATE_CREATE",
    targetType: "EMBED_TEMPLATE",
    targetId: template.id,
    details: { name: template.name },
  });

  return NextResponse.json({ success: true, template });
}
