import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, hasRequiredRole } from "@/lib/auth";
import { dispatchEmbedToDiscord } from "@/bot/discordService";
import { logAuditEvent } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || !hasRequiredRole(user.role, ["ADMIN", "SUPPORT_LEAD", "SUPPORT_AGENT"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { channelId, title, description, color, authorName, footerText, fields, hasTimestamp } = body;

  if (!channelId) {
    return NextResponse.json({ error: "Target Channel ID is required" }, { status: 400 });
  }

  const result = await dispatchEmbedToDiscord({
    channelId,
    title,
    description,
    color,
    authorName,
    footerText,
    fields: Array.isArray(fields) ? fields : typeof fields === "string" ? JSON.parse(fields) : [],
    hasTimestamp,
  });

  await logAuditEvent({
    actorDiscordId: user.discordId,
    actorUsername: user.username,
    action: "EMBED_DISPATCH",
    targetType: "CHANNEL",
    targetId: channelId,
    details: { title, success: result.success, error: result.error },
  });

  return NextResponse.json(result);
}
