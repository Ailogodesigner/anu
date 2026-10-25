import { Client, GatewayIntentBits, REST, Routes, Events, ActivityType } from "discord.js";
import { setBotClient } from "./discordService";
import { slashCommands, handleSlashCommand } from "./commands";
import { handleButtonInteraction } from "./handlers/buttonHandler";
import { prisma } from "../lib/prisma";
import { generateSupportResponse } from "../lib/ai";
import { escalateTicket } from "../lib/escalation";
import { processDueJobs } from "../lib/queue";

const token = process.env.DISCORD_BOT_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DISCORD_GUILD_ID;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`🤖 Discord Bot connected as ${readyClient.user.tag}`);
  setBotClient(readyClient);

  readyClient.user.setPresence({
    activities: [{ name: "Apex VPS Support • /ticket", type: ActivityType.Watching }],
    status: "online",
  });

  // Register slash commands if client credentials are provided
  if (token && clientId) {
    try {
      const rest = new REST({ version: "10" }).setToken(token);
      console.log("🔄 Registering slash commands with Discord API...");

      const body = slashCommands.map((c) => c.toJSON());

      if (guildId) {
        await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body });
        console.log(`✅ Successfully registered slash commands for guild: ${guildId}`);
      } else {
        await rest.put(Routes.applicationCommands(clientId), { body });
        console.log("✅ Successfully registered global slash commands.");
      }
    } catch (err) {
      console.error("❌ Failed to register Discord slash commands:", err);
    }
  }

  // Start background job queue polling loop (every 30 seconds)
  setInterval(async () => {
    try {
      await processDueJobs();
    } catch (err) {
      console.error("Error processing scheduled queue jobs:", err);
    }
  }, 30000);
});

// Interaction handler (Slash commands and buttons)
client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      await handleSlashCommand(interaction);
    } else if (interaction.isButton()) {
      await handleButtonInteraction(interaction);
    }
  } catch (err) {
    console.error("Interaction handling error:", err);
    if (interaction.isRepliable() && !interaction.replied) {
      const content = "❌ An unexpected error occurred while executing this command.";
      if (interaction.deferred) {
        await interaction.editReply({ content });
      } else {
        await interaction.reply({ content, ephemeral: true });
      }
    }
  }
});

// Message listener for Ticket Conversation & AI Troubleshooting synchronization
client.on(Events.MessageCreate, async (message) => {
  // Ignore messages from bots
  if (message.author.bot) return;

  // Check if this channel is a registered ticket channel
  const ticket = await prisma.ticket.findFirst({
    where: { channelId: message.channel.id },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      assignedStaff: true,
    },
  });

  if (!ticket) return;

  // Determine if sender is staff
  const staffMember = await prisma.user.findUnique({
    where: { discordId: message.author.id },
  });

  const isStaff = !!(staffMember && staffMember.role !== "VIEWER");

  // 1. Record incoming message in database
  await prisma.ticketMessage.create({
    data: {
      ticketId: ticket.id,
      senderDiscordId: message.author.id,
      senderUsername: message.author.username,
      senderAvatar: message.author.displayAvatarURL(),
      isStaff,
      isBot: false,
      isAi: false,
      content: message.content,
      discordMessageId: message.id,
    },
  });

  // If staff replied, update ticket status to STAFF_REPLY
  if (isStaff) {
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: { status: "STAFF_REPLY" },
    });
    return;
  }

  // If customer replied and ticket is open, invoke AI assistant or check escalation
  if (!isStaff && ticket.status !== "RESOLVED" && ticket.status !== "CLOSED") {
    // If ticket is already awaiting staff, inform customer without spamming
    if (ticket.status === "AWAITING_STAFF") {
      return;
    }

    // Call AI support service
    const history = ticket.messages.map((m) => ({
      role: (m.isStaff || m.isBot ? "assistant" : "user") as "user" | "assistant",
      content: m.content,
    }));

    const aiRes = await generateSupportResponse(message.content, history);

    if (aiRes.shouldEscalate) {
      await escalateTicket({
        ticketId: ticket.id,
        reason: aiRes.escalationReason || "Automated escalation triggered by customer message",
        actorDiscordId: "AI_ENGINE",
        actorUsername: "Apex AI Assistant",
        isAiTriggered: true,
      });

      // Send escalation response to Discord
      await message.reply(
        `🚨 **Ticket #${ticket.ticketNumber} Escalated to Staff**\n${aiRes.reply}\n\nA support lead or assigned NetOps engineer has been notified.`
      );

      // Record in DB
      await prisma.ticketMessage.create({
        data: {
          ticketId: ticket.id,
          senderDiscordId: client.user?.id || "BOT",
          senderUsername: "Apex AI Assistant",
          isStaff: false,
          isBot: true,
          isAi: true,
          content: aiRes.reply,
        },
      });
    } else {
      // Send regular AI troubleshooting response
      const reply = await message.reply(aiRes.reply);

      // Record in DB
      await prisma.ticketMessage.create({
        data: {
          ticketId: ticket.id,
          senderDiscordId: client.user?.id || "BOT",
          senderUsername: "Apex AI Assistant",
          isStaff: false,
          isBot: true,
          isAi: true,
          content: aiRes.reply,
          discordMessageId: reply.id,
        },
      });
    }
  }
});

// Launch client if token is present, else log configuration guide
if (!token || token === "your_discord_bot_token_here") {
  console.log("------------------------------------------------------------------");
  console.log("⚠️  DISCORD_BOT_TOKEN is not configured in your environment.");
  console.log("ℹ️  The bot process is in Standby / Testing mode.");
  console.log("ℹ️  Configure DISCORD_BOT_TOKEN in .env when ready to connect to Discord Gateway.");
  console.log("ℹ️  Background job worker & API endpoints are active.");
  console.log("------------------------------------------------------------------");

  // Still run the persistent scheduled job queue worker
  setInterval(async () => {
    try {
      await processDueJobs();
    } catch (err) {
      console.error("Queue worker error:", err);
    }
  }, 30000);
} else {
  client.login(token).catch((err) => {
    console.error("❌ Failed to log into Discord Gateway:", err);
  });
}
