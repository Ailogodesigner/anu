import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { generateSupportResponse } from "@/lib/ai";

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { query, history } = await req.json();
  if (!query || typeof query !== "string") {
    return NextResponse.json({ error: "Query string is required" }, { status: 400 });
  }

  const response = await generateSupportResponse(query, history || []);
  return NextResponse.json(response);
}
