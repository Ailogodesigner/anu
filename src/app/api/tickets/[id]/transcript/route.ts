import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { generateTicketTranscript } from "@/lib/transcripts";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") || "json";

  let transcript = await prisma.ticketTranscript.findUnique({
    where: { ticketId: params.id },
  });

  if (!transcript) {
    transcript = await generateTicketTranscript(params.id);
  }

  if (format === "html") {
    return new NextResponse(transcript.htmlContent || "", {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="transcript-${params.id}.html"`,
      },
    });
  }

  if (format === "markdown") {
    return new NextResponse(transcript.markdownContent || "", {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="transcript-${params.id}.md"`,
      },
    });
  }

  return NextResponse.json({ transcript });
}
