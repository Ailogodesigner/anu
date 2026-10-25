import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [
    totalTickets,
    openTickets,
    awaitingStaffTickets,
    resolvedTickets,
    activeStaffCount,
    totalStaffCount,
    recentTickets,
    recentAudits,
    pendingJobsCount,
    aiConfig,
  ] = await Promise.all([
    prisma.ticket.count(),
    prisma.ticket.count({ where: { status: "OPEN" } }),
    prisma.ticket.count({ where: { status: "AWAITING_STAFF" } }),
    prisma.ticket.count({ where: { status: "RESOLVED" } }),
    prisma.user.count({ where: { status: "ONLINE" } }),
    prisma.user.count(),
    prisma.ticket.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: { category: true, assignedStaff: true },
    }),
    prisma.auditLog.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
    }),
    prisma.scheduledJob.count({ where: { status: "PENDING" } }),
    prisma.aiConfig.findFirst(),
  ]);

  const activeTickets = openTickets + awaitingStaffTickets;
  const escalationRate = totalTickets > 0 ? Math.round((awaitingStaffTickets / totalTickets) * 100) : 0;

  // Calculate average first response time from transcripts
  const transcripts = await prisma.ticketTranscript.findMany({
    where: { firstResponseMinutes: { not: null } },
    select: { firstResponseMinutes: true },
    take: 50,
  });

  const avgResponseTime =
    transcripts.length > 0
      ? Math.round(
          transcripts.reduce((acc, curr) => acc + (curr.firstResponseMinutes || 0), 0) / transcripts.length
        )
      : 14;

  return NextResponse.json({
    metrics: {
      totalTickets,
      activeTickets,
      awaitingStaffTickets,
      resolvedTickets,
      escalationRate,
      avgResponseTime,
      activeStaffCount,
      totalStaffCount,
      pendingJobsCount,
    },
    systemHealth: {
      botStatus: "ONLINE",
      memoryUsageMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
      uptimeSeconds: Math.round(process.uptime()),
      aiProvider: aiConfig?.provider || "LOCAL_FALLBACK",
      tokensUsedThisMonth: aiConfig?.tokensUsedThisMonth || 0,
      monthlyTokenLimit: aiConfig?.monthlyTokenLimit || 500000,
    },
    recentTickets,
    recentAudits,
  });
}
