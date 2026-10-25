import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, hasRequiredRole } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const announcements = await prisma.scheduledAnnouncement.findMany({
    orderBy: { scheduledFor: "desc" },
  });

  return NextResponse.json({ announcements });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || !hasRequiredRole(user.role, ["ADMIN", "SUPPORT_LEAD"])) {
    return NextResponse.json({ error: "Forbidden: Admin or Support Lead required" }, { status: 403 });
  }

  const body = await req.json();
  const { title, content, channelId, channelName, scheduledFor, embedData } = body;

  if (!title || !content || !channelId || !scheduledFor) {
    return NextResponse.json({ error: "Title, content, channelId, and scheduledFor are required" }, { status: 400 });
  }

  // Idempotency and duplicate prevention key
  const idempotencyKey = `ann_${channelId}_${new Date(scheduledFor).getTime()}_${title.slice(0, 20).replace(/\s+/g, "_")}`;

  const existing = await prisma.scheduledAnnouncement.findUnique({
    where: { idempotencyKey },
  });

  if (existing) {
    return NextResponse.json(
      { error: "A duplicate announcement with identical title and timestamp is already scheduled." },
      { status: 409 }
    );
  }

  const announcement = await prisma.scheduledAnnouncement.create({
    data: {
      title,
      content,
      channelId,
      channelName: channelName || null,
      embedData: embedData ? (typeof embedData === "string" ? embedData : JSON.stringify(embedData)) : null,
      scheduledFor: new Date(scheduledFor),
      status: "PENDING",
      idempotencyKey,
    },
  });

  await logAuditEvent({
    actorDiscordId: user.discordId,
    actorUsername: user.username,
    action: "ANNOUNCEMENT_SCHEDULE",
    targetType: "ANNOUNCEMENT",
    targetId: announcement.id,
    details: { title, scheduledFor, channelId },
  });

  return NextResponse.json({ success: true, announcement });
}
