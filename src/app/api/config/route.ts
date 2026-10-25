import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, hasRequiredRole } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let guildConfig = await prisma.guildConfig.findFirst();
  if (!guildConfig) {
    guildConfig = await prisma.guildConfig.create({
      data: {
        guildId: process.env.DISCORD_GUILD_ID || "123456789012345678",
        guildName: "Apex VPS Hosting Infrastructure",
      },
    });
  }

  const categories = await prisma.ticketCategory.findMany({
    orderBy: { order: "asc" },
  });

  return NextResponse.json({ guildConfig, categories });
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || !hasRequiredRole(user.role, ["ADMIN"])) {
    return NextResponse.json({ error: "Forbidden: Admin role required" }, { status: 403 });
  }

  const body = await req.json();
  const existing = await prisma.guildConfig.findFirst();

  let updated;
  if (existing) {
    updated = await prisma.guildConfig.update({
      where: { id: existing.id },
      data: {
        guildName: body.guildName,
        ticketCategoryId: body.ticketCategoryId,
        transcriptChannelId: body.transcriptChannelId,
        auditLogChannelId: body.auditLogChannelId,
        announcementChannelId: body.announcementChannelId,
        adminRoleId: body.adminRoleId,
        supportRoleId: body.supportRoleId,
        escalationRoleId: body.escalationRoleId,
        maxTicketsPerUser: Number(body.maxTicketsPerUser) || 3,
        autoCloseHours: Number(body.autoCloseHours) || 48,
        enableAiSupport: body.enableAiSupport !== undefined ? body.enableAiSupport : true,
        aiEscalationSensitivity: body.aiEscalationSensitivity || "NORMAL",
      },
    });
  } else {
    updated = await prisma.guildConfig.create({
      data: body,
    });
  }

  await logAuditEvent({
    actorDiscordId: user.discordId,
    actorUsername: user.username,
    action: "GUILD_CONFIG_UPDATE",
    targetType: "GUILD_CONFIG",
    targetId: updated.id,
    details: { changes: body },
  });

  return NextResponse.json({ success: true, guildConfig: updated });
}
