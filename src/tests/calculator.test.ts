import { describe, it, expect } from "vitest";
import { evaluateSafeFormula, calculateVpsPricing, VpsSpecs, PricingConfig } from "../lib/calculator";

describe("Safe Arithmetic Evaluator & VPS Pricing Engine", () => {
  it("should evaluate standard mathematical expressions correctly", () => {
    const vars = { base: 5, cpu: 4, cpuPrice: 2.5 };
    const formula = "base + (cpu * cpuPrice)";
    const result = evaluateSafeFormula(formula, vars);
    expect(result).toBe(15);
  });

  it("should prevent division by zero gracefully", () => {
    const vars = { base: 10, divisor: 0 };
    expect(() => evaluateSafeFormula("base / divisor", vars)).toThrow("Division by zero in formula");
  });

  it("should reject malicious injection or disallowed characters", () => {
    const vars = { base: 5 };
    expect(() => evaluateSafeFormula("base; alert(1)", vars)).toThrow();
    expect(() => evaluateSafeFormula("base.constructor", vars)).toThrow();
    expect(() => evaluateSafeFormula("process.exit()", vars)).toThrow();
  });

  it("should calculate complete VPS pricing with itemized breakdowns and 10% annual discount", () => {
    const specs: VpsSpecs = {
      cpu: 4,
      ram: 8,
      nvme: 100,
      bandwidth: 5,
      ipv4: 1,
      ddosTier: "standard",
      backupTier: "weekly",
    };

    const config: PricingConfig = {
      basePrice: 5.0,
      cpuCorePrice: 2.5,
      ramGbPrice: 1.5,
      nvmeGbPrice: 0.1,
      bandwidthTbPrice: 1.0,
      ipv4Price: 2.0,
      ddosTierPrice: { standard: 0, advanced: 12, enterprise: 35 },
      backupTierPrice: { none: 0, weekly: 4, daily: 8 },
      formulaExpression: "base + (cpu * cpuPrice) + (ram * ramPrice) + (nvme * nvmePrice) + (bw * bwPrice) + (ip * ipPrice) + ddos + backup",
    };

    const quote = calculateVpsPricing(specs, config);

    expect(quote.isValid).toBe(true);
    // base (5) + cpu (4 * 2.5 = 10) + ram (8 * 1.5 = 12) + nvme (100 * 0.1 = 10) + bw (5 * 1 = 5) + ip (1 * 2 = 2) + ddos (0) + backup (4) = 48
    expect(quote.monthlyPrice).toBe(48);
    // Yearly: 48 * 12 * 0.9 = 518.4
    expect(quote.yearlyPrice).toBe(518.4);
    expect(quote.itemized.cpu.total).toBe(10);
    expect(quote.itemized.ram.total).toBe(12);
  });
});
