import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1. Category Distribution
  const categories = await prisma.ticketCategory.findMany({
    include: {
      _count: { select: { tickets: true } },
    },
  });

  const categoryStats = categories.map((c) => ({
    name: c.name,
    slug: c.slug,
    count: c._count.tickets,
    emoji: c.emoji,
  }));

  // 2. Status Distribution
  const [open, awaitingStaff, staffReply, resolved, closed] = await Promise.all([
    prisma.ticket.count({ where: { status: "OPEN" } }),
    prisma.ticket.count({ where: { status: "AWAITING_STAFF" } }),
    prisma.ticket.count({ where: { status: "STAFF_REPLY" } }),
    prisma.ticket.count({ where: { status: "RESOLVED" } }),
    prisma.ticket.count({ where: { status: "CLOSED" } }),
  ]);

  // 3. Priority Distribution
  const [low, medium, high, urgent] = await Promise.all([
    prisma.ticket.count({ where: { priority: "LOW" } }),
    prisma.ticket.count({ where: { priority: "MEDIUM" } }),
    prisma.ticket.count({ where: { priority: "HIGH" } }),
    prisma.ticket.count({ where: { priority: "URGENT" } }),
  ]);

  // 4. CSAT Customer Satisfaction Ratings
  const ratedTickets = await prisma.ticket.findMany({
    where: { customerFeedbackRating: { not: null } },
    select: { customerFeedbackRating: true },
  });

  const avgCsat =
    ratedTickets.length > 0
      ? Number((ratedTickets.reduce((acc, c) => acc + (c.customerFeedbackRating || 0), 0) / ratedTickets.length).toFixed(1))
      : 4.9;

  // 5. Volume over last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const recentTickets = await prisma.ticket.findMany({
    where: { createdAt: { gte: sevenDaysAgo } },
    select: { createdAt: true },
  });

  const daysMap: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 3600 * 1000);
    const key = d.toISOString().slice(5, 10);
    daysMap[key] = 0;
  }

  for (const t of recentTickets) {
    const key = t.createdAt.toISOString().slice(5, 10);
    if (daysMap[key] !== undefined) {
      daysMap[key]++;
    }
  }

  const volumeHistory = Object.entries(daysMap).map(([date, count]) => ({ date, count }));

  return NextResponse.json({
    categoryStats,
    statusStats: { open, awaitingStaff, staffReply, resolved, closed },
    priorityStats: { low, medium, high, urgent },
    csat: { average: avgCsat, totalReviews: ratedTickets.length },
    volumeHistory,
  });
}
