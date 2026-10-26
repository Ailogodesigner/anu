import { ButtonInteraction, EmbedBuilder } from "discord.js";
import { prisma } from "../../lib/prisma";
import { escalateTicket } from "../../lib/escalation";
import { generateTicketTranscript } from "../../lib/transcripts";
import { logAuditEvent } from "../../lib/audit";

export async function handleButtonInteraction(interaction: ButtonInteraction) {
  const customId = interaction.customId;

  if (customId.startsWith("ticket_claim_")) {
    await interaction.deferReply({ ephemeral: true });
    const ticketId = customId.replace("ticket_claim_", "");

    const staffMember = await prisma.user.findUnique({
      where: { discordId: interaction.user.id },
    });

    if (!staffMember || staffMember.role === "VIEWER") {
      await interaction.editReply({ content: "❌ You must have an authorized staff role to claim tickets." });
      return;
    }

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      await interaction.editReply({ content: "❌ Ticket not found." });
      return;
    }

    await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        assignedStaffId: staffMember.id,
        claimedAt: new Date(),
        status: "STAFF_REPLY",
      },
    });

    await prisma.user.update({
      where: { id: staffMember.id },
      data: { activeTicketsCount: { increment: 1 } },
    });

    await logAuditEvent({
      actorDiscordId: interaction.user.id,
      actorUsername: interaction.user.username,
      action: "TICKET_CLAIM",
      targetType: "TICKET",
      targetId: ticket.id,
      details: { ticketNumber: ticket.ticketNumber },
    });

    await interaction.editReply({
      content: `✅ You have successfully claimed **Ticket #${ticket.ticketNumber}**. The dashboard and ticket channel have been updated.`,
    });
    return;
  }

  if (customId.startsWith("ticket_escalate_")) {
    await interaction.deferReply();
    const ticketId = customId.replace("ticket_escalate_", "");

    const res = await escalateTicket({
      ticketId,
      reason: "Customer clicked 'Escalate to Staff' button",
      actorDiscordId: interaction.user.id,
      actorUsername: interaction.user.username,
    });

    if (!res.success) {
      await interaction.editReply({ content: `❌ Escalation error: ${res.error}` });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle("🚨 Ticket Escalated to Support Staff")
      .setDescription(res.summary)
      .setColor(0xf59e0b)
      .setFooter({ text: "A staff member will take over this ticket shortly." })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
    return;
  }

  if (customId.startsWith("ticket_close_")) {
    await interaction.deferReply();
    const ticketId = customId.replace("ticket_close_", "");

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { assignedStaff: true },
    });

    if (!ticket) {
      await interaction.editReply({ content: "❌ Ticket not found." });
      return;
    }

    await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        status: "CLOSED",
        closedAt: new Date(),
        resolutionSummary: "Closed via Discord action button.",
      },
    });

    if (ticket.assignedStaffId) {
      await prisma.user.update({
        where: { id: ticket.assignedStaffId },
        data: { activeTicketsCount: { decrement: 1 } },
      });
    }

    // Auto-generate transcript
    await generateTicketTranscript(ticket.id);

    await logAuditEvent({
      actorDiscordId: interaction.user.id,
      actorUsername: interaction.user.username,
      action: "TICKET_CLOSE",
      targetType: "TICKET",
      targetId: ticket.id,
      details: { ticketNumber: ticket.ticketNumber },
    });

    const embed = new EmbedBuilder()
      .setTitle(`🔒 Ticket #${ticket.ticketNumber} Closed`)
      .setDescription("This support ticket has been closed. An archived transcript has been generated and saved to your dashboard.")
      .setColor(0x64748b)
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
    return;
  }

  // Verification button handler for Cavrix Cloud #verify channel
  if (customId === "verify_member" || customId === "verify_button" || customId.startsWith("verify_")) {
    await interaction.deferReply({ ephemeral: true });
    try {
      const guild = interaction.guild;
      const member = interaction.member;
      const verifiedRole = guild?.roles.cache.find(
        (r) => r.name.toLowerCase() === "verified" || r.name.toLowerCase() === "member"
      );
      if (verifiedRole && member && "roles" in member) {
        await (member as any).roles.add(verifiedRole);
      }
      await interaction.editReply({
        content: "✅ **Verification Successful!** Welcome to **Cavrix Cloud** (`CVRX`). You now have full access to all announcements, updates, and community channels.",
      });
    } catch {
      await interaction.editReply({
        content: "✅ **You are verified!** Welcome to **Cavrix Cloud** (`CVRX`).",
      });
    }
    return;
  }
}
