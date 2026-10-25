import { NextRequest, NextResponse } from "next/server";
import { exchangeDiscordCode, createSessionToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(new URL("/login?error=discord_access_denied", request.url));
  }

  try {
    const sessionUser = await exchangeDiscordCode(code);
    const token = await createSessionToken(sessionUser);

    const cookieStore = cookies();
    cookieStore.set("vps_bot_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 3600,
    });

    return NextResponse.redirect(new URL("/dashboard", request.url));
  } catch (err: any) {
    console.error("Discord OAuth Callback Error:", err);
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(err.message)}`, request.url));
  }
}
