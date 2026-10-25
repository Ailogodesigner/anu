import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { calculateVpsPricing } from "@/lib/calculator";

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { specs, config } = await req.json();

  if (!specs || !config) {
    return NextResponse.json({ error: "Specs and config are required" }, { status: 400 });
  }

  const ddosTierPrice = typeof config.ddosTierPrice === "string" ? JSON.parse(config.ddosTierPrice) : config.ddosTierPrice;
  const backupTierPrice = typeof config.backupTierPrice === "string" ? JSON.parse(config.backupTierPrice) : config.backupTierPrice;

  const result = calculateVpsPricing(specs, {
    basePrice: Number(config.basePrice) || 0,
    cpuCorePrice: Number(config.cpuCorePrice) || 0,
    ramGbPrice: Number(config.ramGbPrice) || 0,
    nvmeGbPrice: Number(config.nvmeGbPrice) || 0,
    bandwidthTbPrice: Number(config.bandwidthTbPrice) || 0,
    ipv4Price: Number(config.ipv4Price) || 0,
    ddosTierPrice,
    backupTierPrice,
    formulaExpression: config.formulaExpression,
  });

  return NextResponse.json(result);
}
