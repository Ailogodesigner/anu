import { NextResponse } from "next/server";
import { getDiscordOAuthUrl } from "@/lib/auth";

export async function GET() {
  const oauthUrl = getDiscordOAuthUrl();
  return NextResponse.redirect(oauthUrl);
}
