import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { content } = await req.json();
  if (!content || typeof content !== "string") {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  const note = await prisma.ticketNote.create({
    data: {
      ticketId: params.id,
      staffDiscordId: user.discordId,
      staffUsername: user.username,
      content,
    },
  });

  await logAuditEvent({
    actorDiscordId: user.discordId,
    actorUsername: user.username,
    action: "TICKET_NOTE_ADD",
    targetType: "TICKET",
    targetId: params.id,
    details: { noteId: note.id },
  });

  return NextResponse.json({ success: true, note });
}
