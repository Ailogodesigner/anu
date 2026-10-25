"use client";

import React, { useEffect, useState } from "react";
import {
  Calculator,
  Cpu,
  HardDrive,
  Wifi,
  Shield,
  Layers,
  Save,
  CheckCircle2,
  RefreshCw,
  DollarSign,
  Zap,
} from "lucide-react";

interface PricingConfig {
  name: string;
  basePrice: number;
  cpuCorePrice: number;
  ramGbPrice: number;
  nvmeGbPrice: number;
  bandwidthTbPrice: number;
  ipv4Price: number;
  ddosTierPrice: Record<string, number>;
  backupTierPrice: Record<string, number>;
  formulaExpression: string;
  currency: string;
}

export default function CalculatorsPage() {
  const [config, setConfig] = useState<PricingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Live Spec Interactive Sliders
  const [cpu, setCpu] = useState(4);
  const [ram, setRam] = useState(8);
  const [nvme, setNvme] = useState(100);
  const [bandwidth, setBandwidth] = useState(5);
  const [ipv4, setIpv4] = useState(1);
  const [ddosTier, setDdosTier] = useState<"standard" | "advanced" | "enterprise">("standard");
  const [backupTier, setBackupTier] = useState<"none" | "weekly" | "daily">("weekly");

  // Calculated Output
  const [quote, setQuote] = useState<any>(null);

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/calculators");
      const data = await res.json();
      if (data.config) {
        setConfig({
          ...data.config,
          ddosTierPrice: typeof data.config.ddosTierPrice === "string" ? JSON.parse(data.config.ddosTierPrice) : data.config.ddosTierPrice,
          backupTierPrice: typeof data.config.backupTierPrice === "string" ? JSON.parse(data.config.backupTierPrice) : data.config.backupTierPrice,
        });
      }
    } catch (err) {
      console.error("Error fetching calculator config:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  // Recalculate quote in real-time
  useEffect(() => {
    if (!config) return;

    fetch("/api/calculators/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        specs: { cpu, ram, nvme, bandwidth, ipv4, ddosTier, backupTier },
        config,
      }),
    })
      .then((r) => r.json())
      .then((data) => setQuote(data))
      .catch((err) => console.error("Calc error:", err));
  }, [cpu, ram, nvme, bandwidth, ipv4, ddosTier, backupTier, config]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    setSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/calculators", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Save config error:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !config) {
    return (
      <div className="p-8 text-center text-xs text-muted flex items-center justify-center gap-2">
        <RefreshCw className="w-4 h-4 animate-spin text-accent" />
        <span>Loading VPS pricing model...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Calculator className="w-5 h-5 text-accent" />
            <span>Configurable Hosting Calculators & Safe Math</span>
          </h1>
          <p className="text-xs text-muted mt-1">
            Dynamic hardware resource cost modeling powered by safe AST arithmetic parser.
          </p>
        </div>

        {saveSuccess && (
          <span className="text-xs text-emerald-400 flex items-center gap-1 font-mono">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Pricing Model Updated</span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Interactive Live Spec Builder */}
        <div className="lg:col-span-7 space-y-5">
          <div className="p-6 rounded-xl bg-card border border-border space-y-6 shadow-subtle">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-xs font-bold text-foreground font-mono flex items-center gap-2">
                <Zap className="w-4 h-4 text-accent" />
                <span>INTERACTIVE VPS SPECIFICATION SIMULATOR</span>
              </span>
              <span className="text-[11px] font-mono text-muted">Discord /calc sync</span>
            </div>

            {/* vCPU Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-accent" />
                  <span>vCPU Compute Cores</span>
                </span>
                <span className="font-mono text-sm font-bold text-accent">{cpu} Cores</span>
              </div>
              <input
                type="range"
                min="1"
                max="32"
                step="1"
                value={cpu}
                onChange={(e) => setCpu(parseInt(e.target.value))}
                className="w-full accent-accent"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                <span>1 Core</span>
                <span>8 Cores</span>
                <span>16 Cores</span>
                <span>32 Cores</span>
              </div>
            </div>

            {/* RAM Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-accent" />
                  <span>Dedicated ECC RAM</span>
                </span>
                <span className="font-mono text-sm font-bold text-accent">{ram} GB</span>
              </div>
              <input
                type="range"
                min="2"
                max="128"
                step="2"
                value={ram}
                onChange={(e) => setRam(parseInt(e.target.value))}
                className="w-full accent-accent"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                <span>2 GB</span>
                <span>32 GB</span>
                <span>64 GB</span>
                <span>128 GB</span>
              </div>
            </div>

            {/* NVMe Storage Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4 text-accent" />
                  <span>NVMe Gen4 SSD Storage</span>
                </span>
                <span className="font-mono text-sm font-bold text-accent">{nvme} GB</span>
              </div>
              <input
                type="range"
                min="25"
                max="1000"
                step="25"
                value={nvme}
                onChange={(e) => setNvme(parseInt(e.target.value))}
                className="w-full accent-accent"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                <span>25 GB</span>
                <span>250 GB</span>
                <span>500 GB</span>
                <span>1,000 GB</span>
              </div>
            </div>

            {/* Bandwidth Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Wifi className="w-4 h-4 text-accent" />
                  <span>Monthly Transit Bandwidth (10 Gbps Port)</span>
                </span>
                <span className="font-mono text-sm font-bold text-accent">{bandwidth} TB</span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                step="1"
                value={bandwidth}
                onChange={(e) => setBandwidth(parseInt(e.target.value))}
                className="w-full accent-accent"
              />
            </div>

            {/* Tier Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="block text-muted text-xs mb-1">Dedicated IPv4</label>
                <select
                  value={ipv4}
                  onChange={(e) => setIpv4(parseInt(e.target.value))}
                  className="w-full p-2 rounded-lg bg-[#0B0F19] border border-border text-xs text-foreground focus:outline-none focus:border-accent"
                >
                  <option value={1}>1 Dedicated IP</option>
                  <option value={2}>2 Dedicated IPs</option>
                  <option value={4}>4 Dedicated IPs</option>
                  <option value={8}>8 Dedicated IPs</option>
                </select>
              </div>

              <div>
                <label className="block text-muted text-xs mb-1">DDoS Mitigation</label>
                <select
                  value={ddosTier}
                  onChange={(e) => setDdosTier(e.target.value as any)}
                  className="w-full p-2 rounded-lg bg-[#0B0F19] border border-border text-xs text-foreground focus:outline-none focus:border-accent"
                >
                  <option value="standard">Standard (Included)</option>
                  <option value="advanced">Advanced (+$12/mo)</option>
                  <option value="enterprise">Enterprise L7 (+$35/mo)</option>
                </select>
              </div>

              <div>
                <label className="block text-muted text-xs mb-1">Backup Frequency</label>
                <select
                  value={backupTier}
                  onChange={(e) => setBackupTier(e.target.value as any)}
                  className="w-full p-2 rounded-lg bg-[#0B0F19] border border-border text-xs text-foreground focus:outline-none focus:border-accent"
                >
                  <option value="none">None (Off)</option>
                  <option value="weekly">Weekly Snapshots</option>
                  <option value="daily">Daily Snapshots</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Live Price Breakdown & Pricing Config */}
        <div className="lg:col-span-5 space-y-5">
          {/* Real-time Itemized Quote Card */}
          <div className="p-6 rounded-xl bg-card border border-border space-y-4 shadow-card">
            <div className="text-xs font-bold text-muted uppercase tracking-wider font-mono">
              REAL-TIME HOSTING ESTIMATE
            </div>

            {quote?.isValid ? (
              <div className="space-y-4">
                <div className="flex items-baseline justify-between border-b border-border pb-4">
                  <div>
                    <span className="text-3xl font-bold tracking-tight text-foreground font-mono">
                      ${quote.monthlyPrice.toFixed(2)}
                    </span>
                    <span className="text-xs text-muted"> / month</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-accent font-mono">
                      ${quote.yearlyPrice.toFixed(2)} / yr
                    </span>
                    <div className="text-[10px] text-emerald-400 font-mono">Includes 10% Prepay Discount</div>
                  </div>
                </div>

                <div className="space-y-2 text-xs divide-y divide-border/50">
                  <div className="flex justify-between pt-1.5 text-muted">
                    <span>Base Instance & KVM Virtualization</span>
                    <span className="font-mono text-foreground">${quote.itemized.base.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-1.5 text-muted">
                    <span>{quote.itemized.cpu.count} vCPU Cores (@ ${config.cpuCorePrice}/core)</span>
                    <span className="font-mono text-foreground">${quote.itemized.cpu.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-1.5 text-muted">
                    <span>{quote.itemized.ram.count} GB Dedicated RAM (@ ${config.ramGbPrice}/GB)</span>
                    <span className="font-mono text-foreground">${quote.itemized.ram.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-1.5 text-muted">
                    <span>{quote.itemized.nvme.count} GB NVMe SSD (@ ${config.nvmeGbPrice}/GB)</span>
                    <span className="font-mono text-foreground">${quote.itemized.nvme.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-1.5 text-muted">
                    <span>{quote.itemized.bandwidth.count} TB Transit (@ ${config.bandwidthTbPrice}/TB)</span>
                    <span className="font-mono text-foreground">${quote.itemized.bandwidth.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-1.5 text-muted">
                    <span>{quote.itemized.ipv4.count} IPv4 Address (@ ${config.ipv4Price}/IP)</span>
                    <span className="font-mono text-foreground">${quote.itemized.ipv4.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-1.5 text-muted">
                    <span>DDoS Defense ({quote.itemized.ddos.tier.toUpperCase()})</span>
                    <span className="font-mono text-foreground">${quote.itemized.ddos.cost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-1.5 text-muted">
                    <span>Snapshots ({quote.itemized.backup.tier.toUpperCase()})</span>
                    <span className="font-mono text-foreground">${quote.itemized.backup.cost.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-danger font-mono">{quote?.error || "Invalid calculation"}</div>
            )}
          </div>

          {/* Pricing Formula Configuration */}
          <form onSubmit={handleSaveConfig} className="p-5 rounded-xl bg-card border border-border space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-xs font-bold text-foreground font-mono">PRICING RULES & SAFE MATH FORMULA</span>
              <button
                type="submit"
                disabled={saving}
                className="px-3 py-1.5 rounded-lg bg-accent hover:bg-accent-hover text-black font-semibold text-xs flex items-center gap-1.5 transition shadow-glow"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? "Saving..." : "Save Rates"}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-muted mb-1 font-mono text-[11px]">Base Platform Price ($)</label>
                <input
                  type="number"
                  step="0.5"
                  value={config.basePrice}
                  onChange={(e) => setConfig({ ...config, basePrice: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2 rounded bg-[#0B0F19] border border-border text-foreground font-mono focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-muted mb-1 font-mono text-[11px]">Price per vCPU ($)</label>
                <input
                  type="number"
                  step="0.1"
                  value={config.cpuCorePrice}
                  onChange={(e) => setConfig({ ...config, cpuCorePrice: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2 rounded bg-[#0B0F19] border border-border text-foreground font-mono focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-muted mb-1 font-mono text-[11px]">Price per GB RAM ($)</label>
                <input
                  type="number"
                  step="0.1"
                  value={config.ramGbPrice}
                  onChange={(e) => setConfig({ ...config, ramGbPrice: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2 rounded bg-[#0B0F19] border border-border text-foreground font-mono focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-muted mb-1 font-mono text-[11px]">Price per GB NVMe ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={config.nvmeGbPrice}
                  onChange={(e) => setConfig({ ...config, nvmeGbPrice: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2 rounded bg-[#0B0F19] border border-border text-foreground font-mono focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            <div>
              <label className="block text-muted mb-1 text-[11px] font-mono">AST Formula Expression (No eval)</label>
              <input
                type="text"
                value={config.formulaExpression}
                onChange={(e) => setConfig({ ...config, formulaExpression: e.target.value })}
                className="w-full p-2.5 rounded bg-[#0B0F19] border border-border text-foreground font-mono text-xs focus:outline-none focus:border-accent"
              />
              <span className="text-[10px] text-muted-foreground mt-1 block">
                Allowed variables: base, cpu, cpuPrice, ram, ramPrice, nvme, nvmePrice, bw, bwPrice, ip, ipPrice, ddos, backup
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
