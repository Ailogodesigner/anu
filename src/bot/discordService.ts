import { Client, GatewayIntentBits, EmbedBuilder, TextChannel, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { prisma } from "../lib/prisma";

export interface SendEmbedOptions {
  channelId: string;
  title?: string;
  description?: string;
  color?: string;
  authorName?: string;
  authorIconUrl?: string;
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
  footerText?: string;
  footerIconUrl?: string;
  hasTimestamp?: boolean;
}

let botClient: Client | null = null;

export function getBotClient(): Client | null {
  return botClient;
}

export function setBotClient(client: Client | null) {
  botClient = client;
}

/**
 * Format a Discord embed from standard template payload
 */
export function buildDiscordEmbed(options: SendEmbedOptions): EmbedBuilder {
  const embed = new EmbedBuilder();

  if (options.title) embed.setTitle(options.title);
  if (options.description) embed.setDescription(options.description);
  if (options.color) {
    try {
      const hex = options.color.replace("#", "");
      embed.setColor(parseInt(hex, 16));
    } catch {
      embed.setColor(0x06b6d4);
    }
  } else {
    embed.setColor(0x06b6d4);
  }

  if (options.authorName) {
    embed.setAuthor({
      name: options.authorName,
      iconURL: options.authorIconUrl || undefined,
    });
  }

  if (options.fields && Array.isArray(options.fields)) {
    for (const f of options.fields) {
      if (f.name && f.value) {
        embed.addFields({ name: f.name, value: f.value, inline: !!f.inline });
      }
    }
  }

  if (options.footerText) {
    embed.setFooter({
      text: options.footerText,
      iconURL: options.footerIconUrl || undefined,
    });
  }

  if (options.hasTimestamp) {
    embed.setTimestamp();
  }

  return embed;
}

/**
 * Dispatch an embed to a Discord channel
 */
export async function dispatchEmbedToDiscord(options: SendEmbedOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!botClient || !botClient.isReady()) {
    return {
      success: false,
      error: "Discord Bot is not currently online or connected to the Discord Gateway.",
    };
  }

  try {
    const channel = await botClient.channels.fetch(options.channelId);
    if (!channel || !(channel instanceof TextChannel)) {
      return { success: false, error: "Target channel not found or bot lacks permissions to access it." };
    }

    const embed = buildDiscordEmbed(options);
    const sent = await channel.send({ embeds: [embed] });

    return { success: true, messageId: sent.id };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to dispatch embed" };
  }
}
