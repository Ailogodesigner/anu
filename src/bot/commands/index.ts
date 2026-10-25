import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ChannelType,
} from "discord.js";
import { prisma } from "../../lib/prisma";
import { calculateVpsPricing, VpsSpecs } from "../../lib/calculator";
import { searchKnowledgeBase } from "../../lib/ai";
import { escalateTicket } from "../../lib/escalation";
import { generateTicketTranscript } from "../../lib/transcripts";
import { logAuditEvent } from "../../lib/audit";

export const slashCommands = [
  new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Manage VPS hosting support tickets")
    .addSubcommand((sub) =>
      sub
        .setName("create")
        .setDescription("Open a new support ticket")
        .addStringOption((opt) =>
          opt
            .setName("category")
            .setDescription("Ticket category")
            .setRequired(true)
            .addChoices(
              { name: "VPS Connectivity & Network", value: "vps-connectivity-network" },
              { name: "SSH Access & Firewall", value: "ssh-access-firewall" },
              { name: "Resource & Performance (OOM/CPU)", value: "resource-performance" },
              { name: "Billing & Invoices", value: "billing-inquiries" }
            )
        )
        .addStringOption((opt) =>
          opt.setName("title").setDescription("Brief summary of your issue").setRequired(true)
        )
    )
    .addSubcommand((sub) => sub.setName("claim").setDescription("Claim this ticket (Staff only)"))
    .addSubcommand((sub) =>
      sub
        .setName("escalate")
        .setDescription("Escalate this ticket to human NetOps / Support Lead")
        .addStringOption((opt) =>
          opt.setName("reason").setDescription("Reason for escalation").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("resolve")
        .setDescription("Resolve and close this ticket (Staff only)")
        .addStringOption((opt) =>
          opt.setName("summary").setDescription("Resolution summary").setRequired(true)
        )
    )
    .addSubcommand((sub) => sub.setName("reopen").setDescription("Reopen a recently closed ticket")),

  new SlashCommandBuilder()
    .setName("calc")
    .setDescription("Calculate custom VPS resource configurations and pricing")
    .addIntegerOption((opt) => opt.setName("cpu").setDescription("Number of vCPU cores").setRequired(true))
    .addIntegerOption((opt) => opt.setName("ram").setDescription("Dedicated RAM in GB").setRequired(true))
    .addIntegerOption((opt) => opt.setName("nvme").setDescription("NVMe Storage in GB").setRequired(true))
    .addIntegerOption((opt) => opt.setName("bw").setDescription("Bandwidth in TB").setRequired(false))
    .addIntegerOption((opt) => opt.setName("ipv4").setDescription("Dedicated IPv4 count").setRequired(false))
    .addStringOption((opt) =>
      opt
        .setName("ddos")
        .setDescription("DDoS Mitigation Tier")
        .setRequired(false)
        .addChoices(
          { name: "Standard (Free)", value: "standard" },
          { name: "Advanced ($12/mo)", value: "advanced" },
          { name: "Enterprise ($35/mo)", value: "enterprise" }
        )
    )
    .addStringOption((opt) =>
      opt
        .setName("backup")
        .setDescription("Automated Snapshot Frequency")
        .setRequired(false)
        .addChoices(
          { name: "None ($0/mo)", value: "none" },
          { name: "Weekly ($4/mo)", value: "weekly" },
          { name: "Daily ($8/mo)", value: "daily" }
        )
    ),

  new SlashCommandBuilder()
    .setName("kb")
    .setDescription("Search approved VPS technical documentation")
    .addStringOption((opt) =>
      opt.setName("query").setDescription("Keyword (e.g. ssh, ufw, oom, mtr)").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("status")
    .setDescription("View live bot health, uptime, and VPS support queue metrics"),

  new SlashCommandBuilder()
    .setName("help")
    .setDescription("View command instructions and VPS support guidelines"),
];

/**
 * Handle Slash Command Interactions
 */
export async function handleSlashCommand(interaction: ChatInputCommandInteraction) {
  const { commandName } = interaction;

  if (commandName === "ticket") {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "create") {
      await interaction.deferReply({ ephemeral: true });

      const categorySlug = interaction.options.getString("category", true);
      const title = interaction.options.getString("title", true);

      // Check user ticket rate limit
      const activeTicketsCount = await prisma.ticket.count({
        where: {
          customerDiscordId: interaction.user.id,
          status: { in: ["OPEN", "AWAITING_STAFF", "STAFF_REPLY"] },
        },
      });

      const guildConfig = await prisma.guildConfig.findFirst();
      const maxAllowed = guildConfig?.maxTicketsPerUser || 3;

      if (activeTicketsCount >= maxAllowed) {
        await interaction.editReply({
          content: `❌ You already have **${activeTicketsCount} active tickets**. The maximum allowed per customer is **${maxAllowed}**. Please resolve existing tickets before opening a new one.`,
        });
        return;
      }

      const category = await prisma.ticketCategory.findUnique({
        where: { slug: categorySlug },
      });

      if (!category) {
        await interaction.editReply({ content: "❌ Invalid ticket category selected." });
        return;
      }

      // Generate next ticket number
      const highestTicket = await prisma.ticket.findFirst({
        orderBy: { ticketNumber: "desc" },
      });
      const nextNumber = (highestTicket?.ticketNumber || 1000) + 1;

      // Create ticket record
      const ticket = await prisma.ticket.create({
        data: {
          ticketNumber: nextNumber,
          title,
          categoryId: category.id,
          customerDiscordId: interaction.user.id,
          customerUsername: interaction.user.username,
          customerAvatar: interaction.user.displayAvatarURL(),
          priority: category.defaultPriority,
          status: "OPEN",
          messages: {
            create: {
              senderDiscordId: interaction.user.id,
              senderUsername: interaction.user.username,
              senderAvatar: interaction.user.displayAvatarURL(),
              isStaff: false,
              content: title,
            },
          },
        },
      });

      // Audit log
      await logAuditEvent({
        actorDiscordId: interaction.user.id,
        actorUsername: interaction.user.username,
        action: "TICKET_CREATE",
        targetType: "TICKET",
        targetId: ticket.id,
        details: { ticketNumber: ticket.ticketNumber, category: category.name },
      });

      const embed = new EmbedBuilder()
        .setTitle(`🎫 Ticket #${ticket.ticketNumber} Created`)
        .setDescription(`**${category.emoji || "📁"} ${category.name}**\n\n**Issue:** ${title}\n\nOur AI Assistant will analyze your problem and provide immediate troubleshooting guidance. If needed, you can click **Escalate to Human** at any time.`)
        .setColor(0x06b6d4)
        .addFields(
          { name: "Priority", value: `\`${ticket.priority}\``, inline: true },
          { name: "Status", value: "`OPEN`", inline: true },
          { name: "Customer", value: `<@${interaction.user.id}>`, inline: true }
        )
        .setFooter({ text: "Apex VPS Support • Never share passwords or private keys" })
        .setTimestamp();

      const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId(`ticket_claim_${ticket.id}`).setLabel("Claim Ticket").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`ticket_escalate_${ticket.id}`).setLabel("Escalate to Staff").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`ticket_close_${ticket.id}`).setLabel("Close Ticket").setStyle(ButtonStyle.Danger)
      );

      await interaction.editReply({
        embeds: [embed],
        components: [actionRow],
      });
      return;
    }

    if (subcommand === "claim") {
      await interaction.deferReply();

      // Check if user is staff
      const staffMember = await prisma.user.findUnique({
        where: { discordId: interaction.user.id },
      });

      if (!staffMember || staffMember.role === "VIEWER") {
        await interaction.editReply({ content: "❌ You must have a staff role to claim tickets." });
        return;
      }

      // Find ticket by channelId or latest active ticket
      const ticket = await prisma.ticket.findFirst({
        where: { status: { in: ["OPEN", "AWAITING_STAFF"] } },
        orderBy: { createdAt: "desc" },
      });

      if (!ticket) {
        await interaction.editReply({ content: "❌ No unassigned open tickets found to claim." });
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
        content: `✅ **Ticket #${ticket.ticketNumber}** has been claimed by <@${interaction.user.id}>. Customer has been notified.`,
      });
      return;
    }

    if (subcommand === "escalate") {
      await interaction.deferReply();
      const reason = interaction.options.getString("reason", true);

      const ticket = await prisma.ticket.findFirst({
        where: { status: { in: ["OPEN", "STAFF_REPLY"] } },
        orderBy: { createdAt: "desc" },
      });

      if (!ticket) {
        await interaction.editReply({ content: "❌ No active ticket found to escalate." });
        return;
      }

      const res = await escalateTicket({
        ticketId: ticket.id,
        reason,
        actorDiscordId: interaction.user.id,
        actorUsername: interaction.user.username,
      });

      await interaction.editReply({
        content: `🚨 **Ticket #${ticket.ticketNumber} Escalated to Staff!**\n\n${res.summary}`,
      });
      return;
    }

    if (subcommand === "resolve") {
      await interaction.deferReply();
      const summary = interaction.options.getString("summary", true);

      const staffMember = await prisma.user.findUnique({
        where: { discordId: interaction.user.id },
      });

      if (!staffMember || staffMember.role === "VIEWER") {
        await interaction.editReply({ content: "❌ Only authorized staff can resolve tickets." });
        return;
      }

      const ticket = await prisma.ticket.findFirst({
        where: { status: { in: ["OPEN", "AWAITING_STAFF", "STAFF_REPLY"] } },
        orderBy: { createdAt: "desc" },
      });

      if (!ticket) {
        await interaction.editReply({ content: "❌ No active ticket found to resolve." });
        return;
      }

      await prisma.ticket.update({
        where: { id: ticket.id },
        data: {
          status: "RESOLVED",
          resolvedAt: new Date(),
          resolutionSummary: summary,
        },
      });

      // Generate transcript automatically
      await generateTicketTranscript(ticket.id);

      await prisma.user.update({
        where: { id: staffMember.id },
        data: {
          totalResolvedTickets: { increment: 1 },
          activeTicketsCount: { decrement: 1 },
        },
      });

      await logAuditEvent({
        actorDiscordId: interaction.user.id,
        actorUsername: interaction.user.username,
        action: "TICKET_RESOLVE",
        targetType: "TICKET",
        targetId: ticket.id,
        details: { ticketNumber: ticket.ticketNumber, summary },
      });

      const embed = new EmbedBuilder()
        .setTitle(`✅ Ticket #${ticket.ticketNumber} Resolved`)
        .setDescription(`**Resolution:** ${summary}\n\nA persistent transcript has been generated and archived to the dashboard.`)
        .setColor(0x10b981)
        .setFooter({ text: "Apex VPS Support • Thank you for choosing Apex Cloud" })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      return;
    }
  }

  if (commandName === "calc") {
    await interaction.deferReply();

    const cpu = interaction.options.getInteger("cpu", true);
    const ram = interaction.options.getInteger("ram", true);
    const nvme = interaction.options.getInteger("nvme", true);
    const bandwidth = interaction.options.getInteger("bw") || 1;
    const ipv4 = interaction.options.getInteger("ipv4") || 1;
    const ddosTier = (interaction.options.getString("ddos") as any) || "standard";
    const backupTier = (interaction.options.getString("backup") as any) || "none";

    const calcConfig = await prisma.hostingCalculatorConfig.findFirst();
    if (!calcConfig) {
      await interaction.editReply({ content: "❌ Pricing calculator configuration unavailable." });
      return;
    }

    const pricing = calculateVpsPricing(
      { cpu, ram, nvme, bandwidth, ipv4, ddosTier, backupTier },
      {
        basePrice: calcConfig.basePrice,
        cpuCorePrice: calcConfig.cpuCorePrice,
        ramGbPrice: calcConfig.ramGbPrice,
        nvmeGbPrice: calcConfig.nvmeGbPrice,
        bandwidthTbPrice: calcConfig.bandwidthTbPrice,
        ipv4Price: calcConfig.ipv4Price,
        ddosTierPrice: JSON.parse(calcConfig.ddosTierPrice),
        backupTierPrice: JSON.parse(calcConfig.backupTierPrice),
        formulaExpression: calcConfig.formulaExpression,
      }
    );

    if (!pricing.isValid) {
      await interaction.editReply({ content: `❌ Error calculating quote: ${pricing.error}` });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle("⚡ Apex VPS Hosting Cost Calculator")
      .setDescription("Real-time quote calculated using verified enterprise hardware formulas.")
      .setColor(0x00f5d4)
      .addFields(
        { name: "vCPU Cores", value: `\`${cpu} Cores\` ($${pricing.itemized.cpu.total}/mo)`, inline: true },
        { name: "Dedicated RAM", value: `\`${ram} GB\` ($${pricing.itemized.ram.total}/mo)`, inline: true },
        { name: "NVMe Storage", value: `\`${nvme} GB\` ($${pricing.itemized.nvme.total}/mo)`, inline: true },
        { name: "Bandwidth", value: `\`${bandwidth} TB\` ($${pricing.itemized.bandwidth.total}/mo)`, inline: true },
        { name: "Dedicated IPv4", value: `\`${ipv4} IP(s)\` ($${pricing.itemized.ipv4.total}/mo)`, inline: true },
        { name: "DDoS Mitigation", value: `\`${ddosTier.toUpperCase()}\` ($${pricing.itemized.ddos.cost}/mo)`, inline: true },
        { name: "Automated Backup", value: `\`${backupTier.toUpperCase()}\` ($${pricing.itemized.backup.cost}/mo)`, inline: true },
        { name: "Monthly Total", value: `**$${pricing.monthlyPrice.toFixed(2)} / month**`, inline: true },
        { name: "Annual Prepay (10% Off)", value: `**$${pricing.yearlyPrice.toFixed(2)} / year**`, inline: true }
      )
      .setFooter({ text: "All instances include 10 Gbps uplink port & SLA Guarantee" })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
    return;
  }

  if (commandName === "kb") {
    await interaction.deferReply();
    const query = interaction.options.getString("query", true);

    const results = await searchKnowledgeBase(query);

    if (results.length === 0) {
      await interaction.editReply({
        content: `🔍 No documentation articles matched \`${query}\`. Please open a support ticket or ask in the support channel.`,
      });
      return;
    }

    const top = results[0];
    const embed = new EmbedBuilder()
      .setTitle(`📖 Knowledge Base: ${top.title}`)
      .setDescription(top.content.length > 2000 ? top.content.slice(0, 1950) + "..." : top.content)
      .setColor(0x06b6d4)
      .addFields({ name: "Category", value: `\`${top.category}\``, inline: true })
      .setFooter({ text: "Apex VPS Documentation • Verified Solutions" })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
    return;
  }

  if (commandName === "status") {
    await interaction.deferReply();

    const totalOpenTickets = await prisma.ticket.count({
      where: { status: { in: ["OPEN", "AWAITING_STAFF", "STAFF_REPLY"] } },
    });

    const activeStaff = await prisma.user.count({
      where: { status: "ONLINE" },
    });

    const aiConfig = await prisma.aiConfig.findFirst();

    const memUsageMb = Math.round(process.memoryUsage().rss / 1024 / 1024);
    const uptimeHours = (process.uptime() / 3600).toFixed(1);

    const embed = new EmbedBuilder()
      .setTitle("🛡️ Apex Bot & Support Gateway Status")
      .setColor(0x06b6d4)
      .addFields(
        { name: "Gateway Latency", value: `\`${interaction.client.ws.ping} ms\``, inline: true },
        { name: "Bot Uptime", value: `\`${uptimeHours} hours\``, inline: true },
        { name: "Process Memory", value: `\`${memUsageMb} MB RSS\``, inline: true },
        { name: "Active Tickets", value: `\`${totalOpenTickets}\``, inline: true },
        { name: "Staff On Duty", value: `\`${activeStaff} Online\``, inline: true },
        { name: "AI Support Provider", value: `\`${aiConfig?.provider || "LOCAL_FALLBACK"}\``, inline: true }
      )
      .setFooter({ text: "Apex VPS Management System v1.0.0" })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
    return;
  }

  if (commandName === "help") {
    const embed = new EmbedBuilder()
      .setTitle("Apex VPS Support Bot - User Guide")
      .setDescription("Welcome to the Apex VPS technical support and hosting bot.")
      .setColor(0x06b6d4)
      .addFields(
        { name: "/ticket create", value: "Open a categorized support ticket for connection, firewall, resource, or billing queries.", inline: false },
        { name: "/ticket escalate [reason]", value: "Request immediate handoff to human NetOps or Support Lead.", inline: false },
        { name: "/calc vps [specs...]", value: "Interactive hardware resource and monthly price calculator.", inline: false },
        { name: "/kb [query]", value: "Search approved technical documentation (e.g. SSH, UFW, OOM, MTR).", inline: false },
        { name: "/status", value: "View real-time support queue and bot metrics.", inline: false }
      )
      .setFooter({ text: "Apex Cloud Security Policy: Never share root passwords or private keys." });

    await interaction.reply({ embeds: [embed], ephemeral: true });
    return;
  }
}
