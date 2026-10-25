import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const categoryId = searchParams.get("categoryId");
  const assignedStaffId = searchParams.get("assignedStaffId");

  const whereClause: any = {};

  if (status && status !== "ALL") {
    whereClause.status = status;
  }

  if (priority && priority !== "ALL") {
    whereClause.priority = priority;
  }

  if (categoryId && categoryId !== "ALL") {
    whereClause.categoryId = categoryId;
  }

  if (assignedStaffId && assignedStaffId !== "ALL") {
    if (assignedStaffId === "UNASSIGNED") {
      whereClause.assignedStaffId = null;
    } else {
      whereClause.assignedStaffId = assignedStaffId;
    }
  }

  if (search) {
    whereClause.OR = [
      { title: { contains: search } },
      { customerUsername: { contains: search } },
      { customerDiscordId: { contains: search } },
      { escalationReason: { contains: search } },
    ];
  }

  const tickets = await prisma.ticket.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    include: {
      category: true,
      assignedStaff: true,
      _count: {
        select: { messages: true, internalNotes: true },
      },
    },
  });

  return NextResponse.json({ tickets });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { title, categoryId, priority, customerUsername, customerDiscordId, initialMessage } = body;

  if (!title || !categoryId || !customerUsername) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const highestTicket = await prisma.ticket.findFirst({
    orderBy: { ticketNumber: "desc" },
  });
  const nextNumber = (highestTicket?.ticketNumber || 1000) + 1;

  const ticket = await prisma.ticket.create({
    data: {
      ticketNumber: nextNumber,
      title,
      categoryId,
      priority: priority || "MEDIUM",
      status: "OPEN",
      customerUsername,
      customerDiscordId: customerDiscordId || `web_${Date.now()}`,
      messages: {
        create: {
          senderDiscordId: customerDiscordId || `web_${Date.now()}`,
          senderUsername: customerUsername,
          isStaff: false,
          content: initialMessage || title,
        },
      },
    },
    include: { category: true },
  });

  await logAuditEvent({
    actorDiscordId: user.discordId,
    actorUsername: user.username,
    action: "TICKET_CREATE",
    targetType: "TICKET",
    targetId: ticket.id,
    details: { ticketNumber: ticket.ticketNumber, title },
  });

  return NextResponse.json({ success: true, ticket });
}
