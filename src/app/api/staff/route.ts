import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, hasRequiredRole } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const staff = await prisma.user.findMany({
    orderBy: [{ status: "asc" }, { totalResolvedTickets: "desc" }],
    include: {
      assignedTickets: {
        where: { status: { in: ["OPEN", "AWAITING_STAFF", "STAFF_REPLY"] } },
        select: { id: true, ticketNumber: true, priority: true, status: true },
      },
    },
  });

  return NextResponse.json({ staff });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || !hasRequiredRole(user.role, ["ADMIN"])) {
    return NextResponse.json({ error: "Forbidden: Admin role required" }, { status: 403 });
  }

  const body = await req.json();
  const { discordId, username, role, status } = body;

  if (!discordId || !username) {
    return NextResponse.json({ error: "Discord ID and Username are required" }, { status: 400 });
  }

  const newStaff = await prisma.user.create({
    data: {
      discordId,
      username,
      role: role || "SUPPORT_AGENT",
      status: status || "OFFLINE",
    },
  });

  await logAuditEvent({
    actorDiscordId: user.discordId,
    actorUsername: user.username,
    action: "STAFF_CREATE",
    targetType: "STAFF",
    targetId: newStaff.id,
    details: { username: newStaff.username, role: newStaff.role },
  });

  return NextResponse.json({ success: true, staff: newStaff });
}
