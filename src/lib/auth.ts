import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

export type StaffRole = "ADMIN" | "SUPPORT_LEAD" | "SUPPORT_AGENT" | "VIEWER";

export interface SessionUser {
  id: string;
  discordId: string;
  username: string;
  avatar: string | null;
  role: StaffRole;
}

const SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || "default_vps_bot_session_secret_change_in_production_32chars"
);

const COOKIE_NAME = "vps_bot_session";

/**
 * Sign and encrypt a session token
 */
export async function createSessionToken(user: SessionUser): Promise<string> {
  return await new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);
}

/**
 * Verify and decrypt session token
 */
export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return {
      id: payload.id as string,
      discordId: payload.discordId as string,
      username: payload.username as string,
      avatar: (payload.avatar as string) || null,
      role: payload.role as StaffRole,
    };
  } catch (err) {
    return null;
  }
}

/**
 * Get current session user on server side (app router)
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) {
    // If running in development and no session exists, check for demo/fallback user
    if (process.env.NODE_ENV === "development") {
      const demoUser = await prisma.user.findFirst({
        where: { role: "ADMIN" },
      });
      if (demoUser) {
        return {
          id: demoUser.id,
          discordId: demoUser.discordId,
          username: demoUser.username,
          avatar: demoUser.avatar,
          role: demoUser.role as StaffRole,
        };
      }
    }
    return null;
  }

  return await verifySessionToken(token);
}

/**
 * Verify if the user has one of the required roles
 */
export function hasRequiredRole(userRole: StaffRole, allowedRoles: StaffRole[]): boolean {
  const hierarchy: Record<StaffRole, number> = {
    VIEWER: 1,
    SUPPORT_AGENT: 2,
    SUPPORT_LEAD: 3,
    ADMIN: 4,
  };

  const userLevel = hierarchy[userRole] || 0;
  const minRequiredLevel = Math.min(...allowedRoles.map((r) => hierarchy[r] || 99));

  return userLevel >= minRequiredLevel;
}

/**
 * Generate Discord OAuth2 Authorization URL
 */
export function getDiscordOAuthUrl(): string {
  const clientId = process.env.DISCORD_CLIENT_ID || "";
  const redirectUri = encodeURIComponent(
    process.env.DISCORD_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/callback/discord`
  );
  const scope = encodeURIComponent("identify email guilds guilds.members.read");

  return `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
}

/**
 * Exchange Discord authorization code for user data
 */
export async function exchangeDiscordCode(code: string) {
  const clientId = process.env.DISCORD_CLIENT_ID || "";
  const clientSecret = process.env.DISCORD_CLIENT_SECRET || "";
  const redirectUri =
    process.env.DISCORD_REDIRECT_URI ||
    `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/callback/discord`;

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });

  const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!tokenRes.ok) {
    throw new Error(`Failed to exchange code: ${await tokenRes.text()}`);
  }

  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;

  // Fetch Discord User Profile
  const userRes = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!userRes.ok) {
    throw new Error(`Failed to fetch Discord user: ${await userRes.text()}`);
  }

  const discordUser = await userRes.json();

  // Determine role based on configured ADMIN_DISCORD_IDS or database
  const adminIds = (process.env.ADMIN_DISCORD_IDS || "").split(",").map((s) => s.trim());
  let assignedRole: StaffRole = "SUPPORT_AGENT";

  if (adminIds.includes(discordUser.id)) {
    assignedRole = "ADMIN";
  }

  // Upsert user into database
  const user = await prisma.user.upsert({
    where: { discordId: discordUser.id },
    update: {
      username: discordUser.global_name || discordUser.username,
      avatar: discordUser.avatar
        ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
        : null,
      lastActiveAt: new Date(),
    },
    create: {
      discordId: discordUser.id,
      username: discordUser.global_name || discordUser.username,
      discriminator: discordUser.discriminator,
      avatar: discordUser.avatar
        ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
        : null,
      role: assignedRole,
      status: "ONLINE",
      lastActiveAt: new Date(),
    },
  });

  return {
    id: user.id,
    discordId: user.discordId,
    username: user.username,
    avatar: user.avatar,
    role: user.role as StaffRole,
  };
}
