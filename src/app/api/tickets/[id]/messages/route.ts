import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { content } = await req.json();
  if (!content || typeof content !== "string") {
    return NextResponse.json({ error: "Message content is required" }, { status: 400 });
  }

  const message = await prisma.ticketMessage.create({
    data: {
      ticketId: params.id,
      senderDiscordId: user.discordId,
      senderUsername: user.username,
      senderAvatar: user.avatar,
      isStaff: true,
      isBot: false,
      isAi: false,
      content,
    },
  });

  // Update ticket status to STAFF_REPLY
  await prisma.ticket.update({
    where: { id: params.id },
    data: { status: "STAFF_REPLY" },
  });

  return NextResponse.json({ success: true, message });
}
