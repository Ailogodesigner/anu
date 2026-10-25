import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { getBotClient } from "@/bot/discordService";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1. Database Ping
  const dbStart = Date.now();
  let dbStatus = "HEALTHY";
  let dbLatencyMs = 0;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - dbStart;
  } catch (err) {
    dbStatus = "ERROR";
  }

  // 2. Discord Bot Client State
  const client = getBotClient();
  const botConnected = !!(client && client.isReady());
  const wsPing = client ? client.ws.ping : -1;

  // 3. Queue Health
  const [pendingJobs, runningJobs, failedJobs, completedJobs] = await Promise.all([
    prisma.scheduledJob.count({ where: { status: "PENDING" } }),
    prisma.scheduledJob.count({ where: { status: "RUNNING" } }),
    prisma.scheduledJob.count({ where: { status: "FAILED" } }),
    prisma.scheduledJob.count({ where: { status: "COMPLETED" } }),
  ]);

  // 4. AI Engine Health
  const aiConfig = await prisma.aiConfig.findFirst();
  const aiStatus = aiConfig?.provider || "LOCAL_FALLBACK";

  // 5. Environment Secrets Checklist (Safe Boolean Presence only, no tokens exposed)
  const envChecklist = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    DISCORD_BOT_TOKEN: !!process.env.DISCORD_BOT_TOKEN && process.env.DISCORD_BOT_TOKEN !== "your_discord_bot_token_here",
    DISCORD_CLIENT_ID: !!process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_ID !== "your_discord_client_id_here",
    DISCORD_CLIENT_SECRET: !!process.env.DISCORD_CLIENT_SECRET && process.env.DISCORD_CLIENT_SECRET !== "your_discord_client_secret_here",
    DISCORD_GUILD_ID: !!process.env.DISCORD_GUILD_ID && process.env.DISCORD_GUILD_ID !== "your_target_discord_server_id",
    SESSION_SECRET: !!process.env.SESSION_SECRET,
    GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
    OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
    ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
  };

  return NextResponse.json({
    diagnostics: {
      bot: {
        online: botConnected,
        wsLatencyMs: wsPing,
        tag: client?.user?.tag || "Not Connected (Standby)",
        guildsCount: client?.guilds.cache.size || 0,
      },
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
        provider: "Prisma (SQLite Dev / PostgreSQL Prod)",
      },
      queue: {
        status: failedJobs > 5 ? "WARNING" : "HEALTHY",
        pending: pendingJobs,
        running: runningJobs,
        failed: failedJobs,
        completed: completedJobs,
      },
      aiEngine: {
        status: "OPERATIONAL",
        provider: aiStatus,
        fallbackActive: aiConfig?.fallbackEnabled ?? true,
        tokensUsed: aiConfig?.tokensUsedThisMonth || 0,
        monthlyLimit: aiConfig?.monthlyTokenLimit || 500000,
      },
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        uptimeSeconds: Math.round(process.uptime()),
        memoryRssMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
      },
      envChecklist,
    },
  });
}
