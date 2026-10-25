import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, hasRequiredRole } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let config = await prisma.hostingCalculatorConfig.findFirst();
  if (!config) {
    config = await prisma.hostingCalculatorConfig.create({
      data: {
        name: "Enterprise VPS Pricing Model",
        basePrice: 5.0,
        cpuCorePrice: 2.5,
        ramGbPrice: 1.5,
        nvmeGbPrice: 0.1,
        bandwidthTbPrice: 1.0,
        ipv4Price: 2.0,
        ddosTierPrice: JSON.stringify({ standard: 0, advanced: 12, enterprise: 35 }),
        backupTierPrice: JSON.stringify({ none: 0, weekly: 4, daily: 8 }),
      },
    });
  }

  return NextResponse.json({ config });
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || !hasRequiredRole(user.role, ["ADMIN", "SUPPORT_LEAD"])) {
    return NextResponse.json({ error: "Forbidden: Admin or Support Lead required" }, { status: 403 });
  }

  const body = await req.json();
  const existing = await prisma.hostingCalculatorConfig.findFirst();

  const updateData = {
    name: body.name,
    basePrice: Number(body.basePrice),
    cpuCorePrice: Number(body.cpuCorePrice),
    ramGbPrice: Number(body.ramGbPrice),
    nvmeGbPrice: Number(body.nvmeGbPrice),
    bandwidthTbPrice: Number(body.bandwidthTbPrice),
    ipv4Price: Number(body.ipv4Price),
    ddosTierPrice: typeof body.ddosTierPrice === "string" ? body.ddosTierPrice : JSON.stringify(body.ddosTierPrice),
    backupTierPrice: typeof body.backupTierPrice === "string" ? body.backupTierPrice : JSON.stringify(body.backupTierPrice),
    formulaExpression: body.formulaExpression,
  };

  let updated;
  if (existing) {
    updated = await prisma.hostingCalculatorConfig.update({
      where: { id: existing.id },
      data: updateData,
    });
  } else {
    updated = await prisma.hostingCalculatorConfig.create({
      data: updateData,
    });
  }

  await logAuditEvent({
    actorDiscordId: user.discordId,
    actorUsername: user.username,
    action: "CALCULATOR_CONFIG_UPDATE",
    targetType: "CALCULATOR",
    targetId: updated.id,
    details: { changes: body },
  });

  return NextResponse.json({ success: true, config: updated });
}
