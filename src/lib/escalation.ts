import { prisma } from "./prisma";
import { logAuditEvent } from "./audit";

export interface EscalationParams {
  ticketId: string;
  reason: string;
  actorDiscordId?: string;
  actorUsername?: string;
  isAiTriggered?: boolean;
}

export interface EscalationResult {
  success: boolean;
  ticketId: string;
  summary: string;
  alreadyEscalated: boolean;
  notifiedRoleOrStaffId?: string | null;
  error?: string;
}

/**
 * Escalate a ticket to human staff with full conversation preservation,
 * summary generation, status update to AWAITING_STAFF, and duplicate notification suppression.
 */
export async function escalateTicket(params: EscalationParams): Promise<EscalationResult> {
  const ticket = await prisma.ticket.findUnique({
    where: { id: params.ticketId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
      category: true,
      assignedStaff: true,
    },
  });

  if (!ticket) {
    return {
      success: false,
      ticketId: params.ticketId,
      summary: "",
      alreadyEscalated: false,
      error: "Ticket not found",
    };
  }

  // Duplicate notification check: If ticket is already AWAITING_STAFF within the last 5 minutes, do not re-notify
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  if (ticket.status === "AWAITING_STAFF" && ticket.escalatedAt && ticket.escalatedAt > fiveMinutesAgo) {
    return {
      success: true,
      ticketId: ticket.id,
      summary: ticket.escalationReason || params.reason,
      alreadyEscalated: true,
      notifiedRoleOrStaffId: ticket.assignedStaff?.discordId || null,
    };
  }

  // 1. Generate concise problem summary and troubleshooting history from messages
  const customerMsgs = ticket.messages.filter((m) => !m.isStaff && !m.isBot);
  const botMsgs = ticket.messages.filter((m) => m.isAi);

  const initialProblem = customerMsgs[0]?.content || ticket.title;
  const lastCustomerMsg = customerMsgs[customerMsgs.length - 1]?.content || initialProblem;

  const generatedSummary = `**Ticket #${ticket.ticketNumber} Escalation Summary**
• **Category:** ${ticket.category.name}
• **Priority:** ${ticket.priority}
• **Customer:** ${ticket.customerUsername} (${ticket.customerDiscordId})
• **Initial Issue:** ${initialProblem.slice(0, 200)}
• **Latest Customer Context:** ${lastCustomerMsg.slice(0, 200)}
• **Troubleshooting Steps Attempted:** ${botMsgs.length} automated diagnostic exchange(s)
• **Escalation Reason:** ${params.reason}`;

  // 2. Determine assigned staff or available on-duty staff member
  let targetStaffId = ticket.assignedStaffId;

  if (!targetStaffId) {
    // Look for an available staff member with status ONLINE and lowest active tickets
    const availableStaff = await prisma.user.findFirst({
      where: {
        role: { in: ["ADMIN", "SUPPORT_LEAD", "SUPPORT_AGENT"] },
        status: "ONLINE",
      },
      orderBy: { activeTicketsCount: "asc" },
    });

    if (availableStaff) {
      targetStaffId = availableStaff.id;
    }
  }

  // 3. Update the ticket to AWAITING_STAFF and persist the escalation timestamp & reason
  await prisma.ticket.update({
    where: { id: ticket.id },
    data: {
      status: "AWAITING_STAFF",
      priority: ticket.priority === "LOW" ? "HIGH" : ticket.priority,
      escalatedAt: new Date(),
      escalationReason: params.reason,
      assignedStaffId: targetStaffId,
    },
  });

  if (targetStaffId) {
    await prisma.user.update({
      where: { id: targetStaffId },
      data: { activeTicketsCount: { increment: 1 } },
    });
  }

  // 4. Save internal note documenting the handoff
  await prisma.ticketNote.create({
    data: {
      ticketId: ticket.id,
      staffDiscordId: params.actorDiscordId || "SYSTEM_ESCALATION",
      staffUsername: params.actorUsername || (params.isAiTriggered ? "AI Escalation Engine" : "System"),
      content: `[Automated Escalation Log]\n${generatedSummary}`,
    },
  });

  // 5. Audit log
  await logAuditEvent({
    actorDiscordId: params.actorDiscordId || "SYSTEM",
    actorUsername: params.actorUsername || (params.isAiTriggered ? "AI Engine" : "System"),
    action: "TICKET_ESCALATE",
    targetType: "TICKET",
    targetId: ticket.id,
    details: {
      ticketNumber: ticket.ticketNumber,
      reason: params.reason,
      assignedStaffId: targetStaffId,
    },
  });

  return {
    success: true,
    ticketId: ticket.id,
    summary: generatedSummary,
    alreadyEscalated: false,
    notifiedRoleOrStaffId: targetStaffId,
  };
}
