"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Ticket,
  AlertTriangle,
  Clock,
  TrendingUp,
  Users,
  Activity,
  Server,
  Zap,
  ArrowUpRight,
  ShieldCheck,
  Bot,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  PlusCircle,
  Megaphone,
} from "lucide-react";

interface OverviewData {
  metrics: {
    totalTickets: number;
    activeTickets: number;
    awaitingStaffTickets: number;
    resolvedTickets: number;
    escalationRate: number;
    avgResponseTime: number;
    activeStaffCount: number;
    totalStaffCount: number;
    pendingJobsCount: number;
  };
  systemHealth: {
    botStatus: string;
    memoryUsageMb: number;
    uptimeSeconds: number;
    aiProvider: string;
    tokensUsedThisMonth: number;
    monthlyTokenLimit: number;
  };
  recentTickets: Array<{
    id: string;
    ticketNumber: number;
    title: string;
    status: string;
    priority: string;
    customerUsername: string;
    createdAt: string;
    category: { name: string; emoji: string | null };
    assignedStaff: { username: string } | null;
  }>;
  recentAudits: Array<{
    id: string;
    actorUsername: string;
    action: string;
    targetType: string;
    createdAt: string;
    details: string | null;
  }>;
}

export default function OverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats/overview")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load overview data");
        return res.json();
      })
      .then((resData) => {
        if (resData && resData.metrics && resData.systemHealth) {
          setData(resData);
        }
      })
      .catch((err) => {
        console.error("Overview fetch error:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading || !data || !data.metrics || !data.systemHealth) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-card rounded"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-card rounded-xl border border-border"></div>
          ))}
        </div>
      </div>
    );
  }

  const metrics = data.metrics || {
    totalTickets: 0,
    activeTickets: 0,
    awaitingStaffTickets: 0,
    resolvedTickets: 0,
    escalationRate: 0,
    avgResponseTime: 0,
    activeStaffCount: 0,
    totalStaffCount: 0,
    pendingJobsCount: 0,
  };
  const systemHealth = data.systemHealth || {
    botStatus: "ONLINE",
    memoryUsageMb: 0,
    uptimeSeconds: 0,
    aiProvider: "N/A",
    tokensUsedThisMonth: 0,
    monthlyTokenLimit: 500000,
  };
  const recentTickets = data.recentTickets || [];
  const recentAudits = data.recentAudits || [];

  return (
    <div className="space-y-8">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-card to-card-secondary border border-border">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>Apex VPS Command Center</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-accent/15 border border-accent/30 text-accent font-mono">
              LIVE GATEWAY
            </span>
          </h1>
          <p className="text-xs text-muted mt-1">
            Real-time operations, automated SLA monitoring, and AI-augmented technical support dispatch.
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/dashboard/tickets"
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent hover:bg-accent-hover text-black font-semibold text-xs transition shadow-glow"
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>Manage Queue</span>
          </Link>
          <Link
            href="/dashboard/announcements"
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card-secondary border border-border hover:border-accent/40 text-foreground text-xs transition"
          >
            <Megaphone className="w-3.5 h-3.5 text-accent" />
            <span>Schedule Notice</span>
          </Link>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Tickets */}
        <div className="p-5 rounded-xl bg-card border border-border shadow-subtle hover:border-accent/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">Active Support Tickets</span>
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
              <Ticket className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-foreground">{metrics.activeTickets}</span>
            <span className="text-xs text-muted">/ {metrics.totalTickets} total</span>
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
            <span>{metrics.resolvedTickets} tickets resolved</span>
          </div>
        </div>

        {/* Escalated to Staff */}
        <div className="p-5 rounded-xl bg-card border border-border shadow-subtle hover:border-warning/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">Awaiting Human Staff</span>
            <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center text-warning">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-warning">{metrics.awaitingStaffTickets}</span>
            <span className="text-xs text-muted">escalations</span>
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse"></span>
            <span>{metrics.escalationRate}% escalation rate</span>
          </div>
        </div>

        {/* First Response Time */}
        <div className="p-5 rounded-xl bg-card border border-border shadow-subtle hover:border-emerald-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">Avg SLA Response</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-foreground">{metrics.avgResponseTime}</span>
            <span className="text-xs text-muted">minutes</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Exceeding 30m SLA threshold</span>
          </div>
        </div>

        {/* Active Staff */}
        <div className="p-5 rounded-xl bg-card border border-border shadow-subtle hover:border-cyan-400/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">Staff On Duty</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-400/10 flex items-center justify-center text-cyan-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-foreground">{metrics.activeStaffCount}</span>
            <span className="text-xs text-muted">online / {metrics.totalStaffCount} total</span>
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>NetOps & Support ready</span>
          </div>
        </div>
      </div>

      {/* Gateway & Infrastructure Telemetry Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-card-secondary border border-border flex items-center justify-center text-accent">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-muted">Bot Gateway Telemetry</div>
            <div className="text-sm font-semibold text-foreground flex items-center gap-2 mt-0.5">
              <span>WebSocket Connected</span>
              <span className="text-[11px] font-mono text-emerald-400">ONLINE</span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5 font-mono">
              Memory: {systemHealth.memoryUsageMb} MB RSS
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-card-secondary border border-border flex items-center justify-center text-accent">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-muted">AI Diagnostic Assistant</div>
            <div className="text-sm font-semibold text-foreground flex items-center gap-2 mt-0.5">
              <span>{systemHealth.aiProvider}</span>
              <span className="text-[11px] font-mono text-accent">ACTIVE</span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5 font-mono">
              Tokens: {systemHealth.tokensUsedThisMonth.toLocaleString()} / {systemHealth.monthlyTokenLimit.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-card-secondary border border-border flex items-center justify-center text-accent">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-muted">Scheduled Queue Engine</div>
            <div className="text-sm font-semibold text-foreground flex items-center gap-2 mt-0.5">
              <span>Durable Job Runner</span>
              <span className="text-[11px] font-mono text-emerald-400">IDLE</span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5 font-mono">
              {metrics.pendingJobsCount} pending job(s) in queue
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Recent Tickets & Privileged Audit Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Tickets Table (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ticket className="w-4 h-4 text-accent" />
              <h2 className="text-sm font-bold text-foreground">Recent Ticket Activity</h2>
            </div>
            <Link
              href="/dashboard/tickets"
              className="text-xs text-accent hover:text-accent-hover font-medium flex items-center gap-1"
            >
              <span>View all tickets</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0B0F19] text-muted border-b border-border uppercase font-mono text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Ticket</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Assigned</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentTickets.map((t) => (
                    <tr key={t.id} className="hover:bg-card-secondary/50 transition">
                      <td className="py-3 px-4">
                        <Link href={`/dashboard/tickets/${t.id}`} className="font-semibold text-foreground hover:text-accent">
                          #{t.ticketNumber} - {t.title.slice(0, 36)}...
                        </Link>
                        <div className="text-[11px] text-muted mt-0.5">by {t.customerUsername}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[11px] text-muted flex items-center gap-1.5">
                          <span>{t.category.emoji || "📁"}</span>
                          <span>{t.category.name}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            t.priority === "URGENT"
                              ? "bg-danger/10 text-danger border border-danger/30"
                              : t.priority === "HIGH"
                              ? "bg-warning/10 text-warning border border-warning/30"
                              : "bg-card-secondary text-muted border border-border"
                          }`}
                        >
                          {t.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-medium font-mono ${
                            t.status === "AWAITING_STAFF"
                              ? "bg-warning/15 text-warning animate-pulse"
                              : t.status === "RESOLVED"
                              ? "bg-emerald-500/15 text-emerald-400"
                              : "bg-accent/15 text-accent-light"
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted">
                        {t.assignedStaff ? t.assignedStaff.username : <span className="text-muted-foreground">Unassigned</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Audit Log Stream (1 col) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-accent" />
              <h2 className="text-sm font-bold text-foreground">Privileged Action Stream</h2>
            </div>
            <Link
              href="/dashboard/audit-logs"
              className="text-xs text-accent hover:text-accent-hover font-medium flex items-center gap-1"
            >
              <span>Audit Log</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            {recentAudits.map((a) => (
              <div key={a.id} className="p-2.5 rounded-lg bg-[#0B0F19] border border-border text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">{a.actorUsername}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {new Date(a.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <div className="font-mono text-[11px] text-accent">{a.action}</div>
                <div className="text-[11px] text-muted truncate">Target: {a.targetType}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
