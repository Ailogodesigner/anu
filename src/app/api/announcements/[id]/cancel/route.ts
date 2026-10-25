import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, hasRequiredRole } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user || !hasRequiredRole(user.role, ["ADMIN", "SUPPORT_LEAD"])) {
    return NextResponse.json({ error: "Forbidden: Admin or Support Lead required" }, { status: 403 });
  }

  const announcement = await prisma.scheduledAnnouncement.update({
    where: { id: params.id },
    data: { status: "CANCELLED" },
  });

  await logAuditEvent({
    actorDiscordId: user.discordId,
    actorUsername: user.username,
    action: "ANNOUNCEMENT_CANCEL",
    targetType: "ANNOUNCEMENT",
    targetId: announcement.id,
    details: { title: announcement.title },
  });

  return NextResponse.json({ success: true, announcement });
}
