import { prisma } from "./prisma";

export interface GenerateTranscriptOptions {
  ticketId: string;
}

/**
 * Generate and persist an enterprise-grade readable transcript (Markdown & standalone HTML)
 */
export async function generateTicketTranscript(ticketId: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      category: true,
      assignedStaff: true,
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!ticket) {
    throw new Error(`Ticket with ID ${ticketId} not found`);
  }

  const messageCount = ticket.messages.length;
  const staffMessages = ticket.messages.filter((m) => m.isStaff);
  const staffCount = new Set(staffMessages.map((m) => m.senderDiscordId)).size;

  // First response time calculation
  let firstResponseMinutes: number | null = null;
  const firstCustomerMsg = ticket.messages.find((m) => !m.isStaff && !m.isBot);
  const firstStaffMsg = ticket.messages.find((m) => m.isStaff);

  if (firstCustomerMsg && firstStaffMsg) {
    const diffMs = firstStaffMsg.createdAt.getTime() - firstCustomerMsg.createdAt.getTime();
    firstResponseMinutes = Math.max(1, Math.round(diffMs / 60000));
  }

  // Total duration calculation
  const durationMs = (ticket.resolvedAt || ticket.closedAt || new Date()).getTime() - ticket.createdAt.getTime();
  const durationMinutes = Math.max(1, Math.round(durationMs / 60000));

  // 1. Build Markdown transcript
  let markdown = `# Apex VPS Support Ticket Transcript\n\n`;
  markdown += `**Ticket Number:** #${ticket.ticketNumber}\n`;
  markdown += `**Title:** ${ticket.title}\n`;
  markdown += `**Category:** ${ticket.category.name}\n`;
  markdown += `**Priority:** ${ticket.priority}\n`;
  markdown += `**Status:** ${ticket.status}\n`;
  markdown += `**Customer:** ${ticket.customerUsername} (\`${ticket.customerDiscordId}\`)\n`;
  markdown += `**Assigned Staff:** ${ticket.assignedStaff ? ticket.assignedStaff.username : "Unassigned"}\n`;
  markdown += `**Created At:** ${ticket.createdAt.toISOString()}\n`;
  if (ticket.resolvedAt) markdown += `**Resolved At:** ${ticket.resolvedAt.toISOString()}\n`;
  if (ticket.resolutionSummary) markdown += `**Resolution Summary:** ${ticket.resolutionSummary}\n`;
  if (ticket.customerFeedbackRating) markdown += `**Customer Rating:** ${ticket.customerFeedbackRating} / 5 Stars\n`;
  markdown += `\n---\n\n### Conversation History\n\n`;

  for (const msg of ticket.messages) {
    let badge = "[Customer]";
    if (msg.isStaff) badge = "[Staff Support]";
    else if (msg.isAi) badge = "[AI Assistant]";
    else if (msg.isBot) badge = "[Bot]";

    const time = msg.createdAt.toISOString().replace("T", " ").slice(0, 19);
    markdown += `**${msg.senderUsername}** ${badge} • *${time} UTC*\n`;
    markdown += `${msg.content}\n\n`;
  }

  // 2. Build standalone HTML transcript matching enterprise dark palette (#0B0F19, #161F30, #06B6D4)
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Ticket #${ticket.ticketNumber} Transcript - Apex VPS Support</title>
  <style>
    body { background-color: #0B0F19; color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 32px 16px; }
    .container { max-width: 860px; margin: 0 auto; }
    .header { background: #161F30; border: 1px solid #1E293B; border-radius: 12px; padding: 24px; margin-bottom: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.4); }
    .header h1 { margin: 0 0 12px 0; color: #00F5D4; font-size: 24px; }
    .meta-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-top: 16px; font-size: 14px; color: #94A3B8; }
    .meta-item strong { color: #F8FAFC; }
    .timeline { display: flex; flex-direction: column; gap: 16px; }
    .message { background: #161F30; border: 1px solid #1E293B; border-radius: 8px; padding: 16px; }
    .message.staff { border-left: 4px solid #06B6D4; }
    .message.ai { border-left: 4px solid #00F5D4; }
    .msg-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
    .author { font-weight: 600; color: #F8FAFC; }
    .badge { font-size: 11px; padding: 2px 8px; border-radius: 9999px; font-weight: bold; margin-left: 8px; }
    .badge.customer { background: #334155; color: #94A3B8; }
    .badge.staff { background: rgba(6, 182, 212, 0.2); color: #06B6D4; border: 1px solid #06B6D4; }
    .badge.ai { background: rgba(0, 245, 212, 0.2); color: #00F5D4; border: 1px solid #00F5D4; }
    .timestamp { font-size: 12px; color: #64748B; }
    .content { font-size: 14px; line-height: 1.6; white-space: pre-wrap; color: #E2E8F0; }
    .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #64748B; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Apex VPS Support Transcript #${ticket.ticketNumber}</h1>
      <p style="margin: 0; color: #94A3B8;">${ticket.title}</p>
      <div class="meta-grid">
        <div class="meta-item">Category: <strong>${ticket.category.name}</strong></div>
        <div class="meta-item">Priority: <strong>${ticket.priority}</strong></div>
        <div class="meta-item">Customer: <strong>${ticket.customerUsername}</strong></div>
        <div class="meta-item">Duration: <strong>${durationMinutes} mins</strong></div>
      </div>
    </div>
    <div class="timeline">`;

  for (const msg of ticket.messages) {
    let msgClass = "message";
    let badgeClass = "badge customer";
    let badgeLabel = "Customer";

    if (msg.isStaff) {
      msgClass = "message staff";
      badgeClass = "badge staff";
      badgeLabel = "Staff Support";
    } else if (msg.isAi) {
      msgClass = "message ai";
      badgeClass = "badge ai";
      badgeLabel = "AI Assistant";
    }

    const time = msg.createdAt.toISOString().replace("T", " ").slice(0, 19);

    html += `
      <div class="${msgClass}">
        <div class="msg-header">
          <div>
            <span class="author">${escapeHtml(msg.senderUsername)}</span>
            <span class="${badgeClass}">${badgeLabel}</span>
          </div>
          <span class="timestamp">${time} UTC</span>
        </div>
        <div class="content">${escapeHtml(msg.content)}</div>
      </div>`;
  }

  html += `
    </div>
    <div class="footer">
      Generated automatically by Apex VPS Management Bot &bull; Confidential Support Transcript
    </div>
  </div>
</body>
</html>`;

  // Persist transcript
  const transcript = await prisma.ticketTranscript.upsert({
    where: { ticketId: ticket.id },
    update: {
      markdownContent: markdown,
      htmlContent: html,
      messageCount,
      staffCount,
      firstResponseMinutes,
      durationMinutes,
      generatedAt: new Date(),
    },
    create: {
      ticketId: ticket.id,
      markdownContent: markdown,
      htmlContent: html,
      messageCount,
      staffCount,
      firstResponseMinutes,
      durationMinutes,
    },
  });

  return transcript;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
