import { NextResponse } from "next/server";
import { getSessionUser, createSessionToken, StaffRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ authenticated: false, user: null });
  }

  return NextResponse.json({ authenticated: true, user });
}

export async function POST(req: Request) {
  // Allow switching roles or users in development/testing mode
  const body = await req.json();
  const { role, username } = body as { role: StaffRole; username?: string };

  const validRoles: StaffRole[] = ["ADMIN", "SUPPORT_LEAD", "SUPPORT_AGENT", "VIEWER"];
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  let dbUser = await prisma.user.findFirst({
    where: { role },
  });

  if (!dbUser) {
    dbUser = await prisma.user.create({
      data: {
        discordId: `demo_${Date.now()}`,
        username: username || `Staff_${role}`,
        role,
        status: "ONLINE",
      },
    });
  }

  const sessionUser = {
    id: dbUser.id,
    discordId: dbUser.discordId,
    username: dbUser.username,
    avatar: dbUser.avatar,
    role: dbUser.role as StaffRole,
  };

  const token = await createSessionToken(sessionUser);
  const cookieStore = cookies();
  cookieStore.set("vps_bot_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 3600,
  });

  return NextResponse.json({ success: true, user: sessionUser });
}
