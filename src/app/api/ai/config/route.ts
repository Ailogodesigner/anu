import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, hasRequiredRole } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let config = await prisma.aiConfig.findFirst();
  if (!config) {
    config = await prisma.aiConfig.create({
      data: {
        provider: "LOCAL_FALLBACK",
        modelName: "gemini-1.5-flash",
        temperature: 0.2,
        maxTokens: 1024,
        systemPrompt: "You are the official AI Technical Support Specialist for Apex VPS Hosting.",
      },
    });
  }

  return NextResponse.json({ config });
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || !hasRequiredRole(user.role, ["ADMIN", "SUPPORT_LEAD"])) {
    return NextResponse.json({ error: "Forbidden: Requires Admin or Support Lead role" }, { status: 403 });
  }

  const body = await req.json();
  const existing = await prisma.aiConfig.findFirst();

  let updated;
  if (existing) {
    updated = await prisma.aiConfig.update({
      where: { id: existing.id },
      data: {
        provider: body.provider,
        modelName: body.modelName,
        temperature: body.temperature,
        maxTokens: body.maxTokens,
        systemPrompt: body.systemPrompt,
        guardrailsEnabled: body.guardrailsEnabled,
        autoTroubleshootSsh: body.autoTroubleshootSsh,
        autoTroubleshootFirewall: body.autoTroubleshootFirewall,
        autoTroubleshootResources: body.autoTroubleshootResources,
        monthlyTokenLimit: body.monthlyTokenLimit,
        fallbackEnabled: body.fallbackEnabled,
      },
    });
  } else {
    updated = await prisma.aiConfig.create({
      data: body,
    });
  }

  await logAuditEvent({
    actorDiscordId: user.discordId,
    actorUsername: user.username,
    action: "AI_CONFIG_UPDATE",
    targetType: "AI_CONFIG",
    targetId: updated.id,
    details: { changes: body },
  });

  return NextResponse.json({ success: true, config: updated });
}
