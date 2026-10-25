import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import { generateTicketTranscript } from "@/lib/transcripts";
import { escalateTicket } from "@/lib/escalation";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: params.id },
    include: {
      category: true,
      assignedStaff: true,
      messages: { orderBy: { createdAt: "asc" } },
      internalNotes: { orderBy: { createdAt: "asc" } },
      transcript: true,
    },
  });

  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  return NextResponse.json({ ticket });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { status, priority, assignedStaffId, resolutionSummary, escalationReason } = body;

  const existing = await prisma.ticket.findUnique({
    where: { id: params.id },
    include: { assignedStaff: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  const updateData: any = {};

  if (priority) updateData.priority = priority;

  if (assignedStaffId !== undefined) {
    updateData.assignedStaffId = assignedStaffId || null;
    if (assignedStaffId && !existing.claimedAt) {
      updateData.claimedAt = new Date();
    }
  }

  if (status) {
    updateData.status = status;
    if (status === "RESOLVED") {
      updateData.resolvedAt = new Date();
      updateData.resolutionSummary = resolutionSummary || "Resolved by staff via dashboard.";
    } else if (status === "CLOSED") {
      updateData.closedAt = new Date();
    } else if (status === "OPEN" && (existing.status === "RESOLVED" || existing.status === "CLOSED")) {
      updateData.reopenedAt = new Date();
    } else if (status === "AWAITING_STAFF" && escalationReason) {
      await escalateTicket({
        ticketId: existing.id,
        reason: escalationReason,
        actorDiscordId: user.discordId,
        actorUsername: user.username,
      });
    }
  }

  const updated = await prisma.ticket.update({
    where: { id: params.id },
    data: updateData,
    include: { category: true, assignedStaff: true },
  });

  // If resolved or closed, generate transcript
  if (status === "RESOLVED" || status === "CLOSED") {
    await generateTicketTranscript(existing.id);
  }

  await logAuditEvent({
    actorDiscordId: user.discordId,
    actorUsername: user.username,
    action: `TICKET_${status || "UPDATE"}`,
    targetType: "TICKET",
    targetId: existing.id,
    details: { ticketNumber: existing.ticketNumber, changes: body },
  });

  return NextResponse.json({ success: true, ticket: updated });
}
