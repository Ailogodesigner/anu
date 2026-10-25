import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, hasRequiredRole } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { status, role } = body;

  const targetUser = await prisma.user.findUnique({ where: { id: params.id } });
  if (!targetUser) {
    return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
  }

  // If changing role, must be ADMIN
  if (role && role !== targetUser.role && !hasRequiredRole(user.role, ["ADMIN"])) {
    return NextResponse.json({ error: "Forbidden: Only Admins can modify staff roles" }, { status: 403 });
  }

  // If changing status of another person, must be ADMIN or SUPPORT_LEAD, otherwise can change own status
  if (status && targetUser.id !== user.id && !hasRequiredRole(user.role, ["ADMIN", "SUPPORT_LEAD"])) {
    return NextResponse.json({ error: "Forbidden: Cannot change other staff's availability" }, { status: 403 });
  }

  const updated = await prisma.user.update({
    where: { id: params.id },
    data: {
      status: status || targetUser.status,
      role: role || targetUser.role,
      lastActiveAt: new Date(),
    },
  });

  await logAuditEvent({
    actorDiscordId: user.discordId,
    actorUsername: user.username,
    action: "STAFF_UPDATE",
    targetType: "STAFF",
    targetId: updated.id,
    details: { changes: body },
  });

  return NextResponse.json({ success: true, staff: updated });
}
