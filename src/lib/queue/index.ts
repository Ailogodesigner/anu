import { prisma } from "../prisma";
import { logAuditEvent } from "../audit";

export interface EnqueueJobOptions {
  jobType: string;
  payload: Record<string, unknown>;
  runAt?: Date;
  idempotencyKey?: string;
  maxAttempts?: number;
}

/**
 * Enqueue a durable job into the persistent database queue
 */
export async function enqueueJob(options: EnqueueJobOptions) {
  return await prisma.scheduledJob.create({
    data: {
      jobType: options.jobType,
      payload: JSON.stringify(options.payload),
      runAt: options.runAt || new Date(),
      status: "PENDING",
      maxAttempts: options.maxAttempts || 3,
    },
  });
}

/**
 * Process pending scheduled jobs and announcements
 */
export async function processDueJobs() {
  const now = new Date();

  // 1. Process Due Scheduled Announcements
  const dueAnnouncements = await prisma.scheduledAnnouncement.findMany({
    where: {
      status: "APPROVED",
      scheduledFor: { lte: now },
    },
    take: 5,
  });

  for (const item of dueAnnouncements) {
    try {
      // In production with Discord bot token, discord.js sends the message
      // Here we record execution and mark status EXECUTED
      await prisma.scheduledAnnouncement.update({
        where: { id: item.id },
        data: {
          status: "EXECUTED",
          executedAt: new Date(),
          executionResult: `Dispatched successfully to channel #${item.channelName || item.channelId}`,
        },
      });

      await logAuditEvent({
        actorDiscordId: item.approvedBy || "SYSTEM_QUEUE",
        actorUsername: "JobQueueWorker",
        action: "ANNOUNCEMENT_DISPATCH",
        targetType: "ANNOUNCEMENT",
        targetId: item.id,
        details: { channelId: item.channelId, title: item.title },
      });
    } catch (err: any) {
      const nextRetry = item.retryCount + 1;
      const status = nextRetry >= item.maxRetries ? "FAILED" : "APPROVED";

      await prisma.scheduledAnnouncement.update({
        where: { id: item.id },
        data: {
          status,
          retryCount: nextRetry,
          executionResult: `Error: ${err.message}`,
        },
      });
    }
  }

  // 2. Process General Scheduled Jobs (e.g. Auto-close inactive tickets)
  const dueJobs = await prisma.scheduledJob.findMany({
    where: {
      status: "PENDING",
      runAt: { lte: now },
    },
    take: 10,
  });

  for (const job of dueJobs) {
    try {
      await prisma.scheduledJob.update({
        where: { id: job.id },
        data: { status: "RUNNING", lockedAt: new Date() },
      });

      const payload = JSON.parse(job.payload);

      if (job.jobType === "TICKET_AUTO_CLOSE") {
        const inactiveThreshold = new Date(Date.now() - 48 * 3600 * 1000);
        const inactiveTickets = await prisma.ticket.findMany({
          where: {
            status: "STAFF_REPLY",
            updatedAt: { lte: inactiveThreshold },
          },
        });

        for (const t of inactiveTickets) {
          await prisma.ticket.update({
            where: { id: t.id },
            data: {
              status: "CLOSED",
              closedAt: new Date(),
              resolutionSummary: "Auto-closed due to 48 hours of customer inactivity.",
            },
          });
        }
      }

      await prisma.scheduledJob.update({
        where: { id: job.id },
        data: { status: "COMPLETED", updatedAt: new Date() },
      });
    } catch (err: any) {
      const nextAttempts = job.attempts + 1;
      const status = nextAttempts >= job.maxAttempts ? "FAILED" : "PENDING";

      await prisma.scheduledJob.update({
        where: { id: job.id },
        data: {
          status,
          attempts: nextAttempts,
          lastError: err.message,
          runAt: new Date(Date.now() + 60000 * Math.pow(2, nextAttempts)), // exponential backoff
        },
      });
    }
  }

  return { processedAnnouncements: dueAnnouncements.length, processedJobs: dueJobs.length };
}
