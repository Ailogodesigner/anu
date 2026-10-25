"use client";

import React, { useEffect, useState } from "react";
import {
  Activity,
  Server,
  Database,
  Bot,
  Layers,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Cpu,
  Key,
  ShieldAlert,
} from "lucide-react";

interface DiagnosticsData {
  bot: {
    online: boolean;
    wsLatencyMs: number;
    tag: string;
    guildsCount: number;
  };
  database: {
    status: string;
    latencyMs: number;
    provider: string;
  };
  queue: {
    status: string;
    pending: number;
    running: number;
    failed: number;
    completed: number;
  };
  aiEngine: {
    status: string;
    provider: string;
    fallbackActive: boolean;
    tokensUsed: number;
    monthlyLimit: number;
  };
  system: {
    nodeVersion: string;
    platform: string;
    uptimeSeconds: number;
    memoryRssMb: number;
  };
  envChecklist: Record<string, boolean>;
}

export default function DiagnosticsPage() {
  const [data, setData] = useState<DiagnosticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDiagnostics = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/bot/diagnostics");
      const d = await res.json();
      setData(d.diagnostics);
    } catch (err) {
      console.error("Diagnostics error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagnostics();
  }, []);

  if (loading || !data) {
    return (
      <div className="p-8 text-center text-xs text-muted flex items-center justify-center gap-2">
        <RefreshCw className="w-4 h-4 animate-spin text-accent" />
        <span>Running health checks and diagnostics...</span>
      </div>
    );
  }

  const { bot, database, queue, aiEngine, system, envChecklist } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Activity className="w-5 h-5 text-accent" />
            <span>Integration Settings & Bot Diagnostics</span>
          </h1>
          <p className="text-xs text-muted mt-1">
            Real-time Discord Gateway health, database latency benchmarks, queue workers, and secret validation.
          </p>
        </div>

        <button
          onClick={fetchDiagnostics}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-card border border-border hover:border-accent text-foreground text-xs font-semibold transition self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-accent" />
          <span>Rerun Health Checks</span>
        </button>
      </div>

      {/* Primary Telemetry Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Discord Gateway */}
        <div className="p-5 rounded-xl bg-card border border-border shadow-subtle space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">Discord Bot Gateway</span>
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                bot.online ? "bg-emerald-400 animate-pulse" : "bg-warning"
              }`}
            ></span>
          </div>
          <div>
            <div className="text-lg font-bold text-foreground font-mono">
              {bot.online ? `${bot.wsLatencyMs} ms` : "STANDBY"}
            </div>
            <div className="text-[11px] text-muted-foreground truncate">{bot.tag}</div>
          </div>
          <div className="text-[10px] text-muted font-mono pt-1 border-t border-border">
            {bot.online ? `Guilds cached: ${bot.guildsCount}` : "Ready for bot token login"}
          </div>
        </div>

        {/* Database */}
        <div className="p-5 rounded-xl bg-card border border-border shadow-subtle space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">Prisma Database</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          </div>
          <div>
            <div className="text-lg font-bold text-foreground font-mono">{database.latencyMs} ms</div>
            <div className="text-[11px] text-emerald-400 font-mono">STATUS: {database.status}</div>
          </div>
          <div className="text-[10px] text-muted font-mono pt-1 border-t border-border truncate">
            {database.provider}
          </div>
        </div>

        {/* Scheduled Queue Worker */}
        <div className="p-5 rounded-xl bg-card border border-border shadow-subtle space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">Durable Job Queue</span>
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                queue.status === "HEALTHY" ? "bg-emerald-400" : "bg-warning"
              }`}
            ></span>
          </div>
          <div>
            <div className="text-lg font-bold text-foreground font-mono">{queue.pending} Pending</div>
            <div className="text-[11px] text-muted-foreground font-mono">
              {queue.running} running &bull; {queue.completed} completed
            </div>
          </div>
          <div className="text-[10px] text-muted font-mono pt-1 border-t border-border">
            {queue.failed} failed job(s)
          </div>
        </div>

        {/* AI Support Engine */}
        <div className="p-5 rounded-xl bg-card border border-border shadow-subtle space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">AI Support Engine</span>
            <span className="w-2.5 h-2.5 rounded-full bg-accent"></span>
          </div>
          <div>
            <div className="text-lg font-bold text-foreground font-mono truncate">{aiEngine.provider}</div>
            <div className="text-[11px] text-accent-light font-mono">
              Tokens: {aiEngine.tokensUsed.toLocaleString()}
            </div>
          </div>
          <div className="text-[10px] text-muted font-mono pt-1 border-t border-border">
            {aiEngine.fallbackActive ? "Graceful fallback active" : "Provider only"}
          </div>
        </div>
      </div>

      {/* Two Column Layout: Environment Secrets Checklist & System Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Environment Secrets Checklist */}
        <div className="p-6 rounded-xl bg-card border border-border space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-accent" />
              <h2 className="text-xs font-bold text-foreground font-mono">ENVIRONMENT SECRETS AUDIT</h2>
            </div>
            <span className="text-[10px] text-muted font-mono">Values securely masked</span>
          </div>

          <div className="space-y-2.5 text-xs">
            {Object.entries(envChecklist).map(([key, isSet]) => (
              <div
                key={key}
                className="flex items-center justify-between p-2.5 rounded-lg bg-[#0B0F19] border border-border font-mono text-[11px]"
              >
                <span className="text-foreground">{key}</span>
                {isSet ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>CONFIGURED</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-warning/15 text-warning border border-warning/30 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>NOT SET</span>
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="pt-2 text-[11px] text-muted leading-relaxed">
            Configure optional external AI keys (<code className="text-accent">GEMINI_API_KEY</code>, <code className="text-accent">OPENAI_API_KEY</code>)
            or connect directly to Discord by populating <code className="text-accent">DISCORD_BOT_TOKEN</code> in your <code className="text-foreground">.env</code> file.
          </div>
        </div>

        {/* System Process Host Info */}
        <div className="p-6 rounded-xl bg-card border border-border space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Cpu className="w-4 h-4 text-accent" />
            <h2 className="text-xs font-bold text-foreground font-mono">SYSTEM PROCESS & RUNTIME</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted">Node.js Runtime</span>
              <span className="font-mono text-foreground font-semibold">{system.nodeVersion}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted">Host Operating System</span>
              <span className="font-mono text-foreground">{system.platform} (win32-x64)</span>
            </div>

            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted">Process Memory RSS</span>
              <span className="font-mono text-accent">{system.memoryRssMb} MB</span>
            </div>

            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted">Bot System Uptime</span>
              <span className="font-mono text-foreground">{Math.round(system.uptimeSeconds / 60)} minutes</span>
            </div>

            <div className="flex justify-between py-2">
              <span className="text-muted">Non-Destructive Enforcement</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-mono text-[10px] font-bold">
                ENFORCED (No mass wipes/bans)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
