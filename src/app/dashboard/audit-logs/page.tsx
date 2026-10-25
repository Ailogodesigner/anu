"use client";

import React, { useEffect, useState } from "react";
import {
  ShieldAlert,
  BarChart3,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  RefreshCw,
  Star,
  Layers,
  ArrowUpRight,
} from "lucide-react";

interface AuditLogItem {
  id: string;
  actorDiscordId: string;
  actorUsername: string;
  action: string;
  targetType: string;
  targetId: string | null;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
}

interface AnalyticsData {
  categoryStats: Array<{ name: string; slug: string; count: number; emoji: string | null }>;
  statusStats: { open: number; awaitingStaff: number; staffReply: number; resolved: number; closed: number };
  priorityStats: { low: number; medium: number; high: number; urgent: number };
  csat: { average: number; totalReviews: number };
  volumeHistory: Array<{ date: string; count: number }>;
}

export default function AuditAnalyticsPage() {
  const [activeTab, setActiveTab] = useState<"audit" | "analytics">("audit");
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [actionFilter, setActionFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (actionFilter !== "ALL") query.set("action", actionFilter);
      if (search) query.set("search", search);

      const [logsRes, analyticsRes] = await Promise.all([
        fetch(`/api/audit-logs?${query.toString()}`).then((r) => r.json()),
        fetch("/api/analytics").then((r) => r.json()),
      ]);

      setLogs(logsRes.logs || []);
      setAnalytics(analyticsRes);
    } catch (err) {
      console.error("Error fetching audit/analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [actionFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-accent" />
            <span>Audit Logs, Error Monitoring & Usage Analytics</span>
          </h1>
          <p className="text-xs text-muted mt-1">
            Immutable privileged action stream and enterprise VPS support resolution benchmarks.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-card border border-border">
          <button
            onClick={() => setActiveTab("audit")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition ${
              activeTab === "audit" ? "bg-accent/15 text-accent font-semibold" : "text-muted hover:text-foreground"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Audit Log Stream</span>
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition ${
              activeTab === "analytics" ? "bg-accent/15 text-accent font-semibold" : "text-muted hover:text-foreground"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Usage Analytics</span>
          </button>
        </div>
      </div>

      {activeTab === "audit" ? (
        /* Audit Logs Tab */
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="p-4 rounded-xl bg-card border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {[
                "ALL",
                "TICKET_CREATE",
                "TICKET_CLAIM",
                "TICKET_RESOLVE",
                "TICKET_ESCALATE",
                "CONFIG_UPDATE",
                "ANNOUNCEMENT_SCHEDULE",
              ].map((a) => (
                <button
                  key={a}
                  onClick={() => setActionFilter(a)}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono font-medium transition ${
                    actionFilter === a
                      ? "bg-accent/15 text-accent border border-accent/40 font-semibold"
                      : "bg-[#0B0F19] text-muted hover:text-foreground border border-border"
                  }`}
                >
                  {a.replace("_", " ")}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="Search actor or details..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchData()}
                className="w-full pl-9 pr-4 py-1.5 rounded-lg bg-[#0B0F19] border border-border text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-subtle">
            {loading ? (
              <div className="p-8 text-center text-xs text-muted flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-accent" />
                <span>Loading audit trail...</span>
              </div>
            ) : logs.length === 0 ? (
              <div className="p-12 text-center text-xs text-muted">No audit logs matching filters.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0B0F19] text-muted border-b border-border uppercase font-mono text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Timestamp (UTC)</th>
                      <th className="py-3 px-4">Staff Actor</th>
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Target Type</th>
                      <th className="py-3 px-4">Audit Payload Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-card-secondary/50 transition font-mono text-[11px]">
                        <td className="py-3 px-4 text-muted whitespace-nowrap">
                          {new Date(log.createdAt).toISOString().replace("T", " ").slice(0, 19)}
                        </td>
                        <td className="py-3 px-4 text-foreground font-semibold">
                          {log.actorUsername}
                          <span className="text-[10px] text-muted block font-normal">{log.actorDiscordId}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded font-bold bg-accent/15 text-accent border border-accent/20">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-muted">{log.targetType}</td>
                        <td className="py-3 px-4 text-muted max-w-md truncate">
                          {log.details || <span className="text-muted-foreground">-</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Analytics Tab */
        analytics && (
          <div className="space-y-6">
            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-xl bg-card border border-border">
                <span className="text-xs font-medium text-muted">Customer Satisfaction (CSAT)</span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight text-amber-400 font-mono flex items-center gap-1">
                    <Star className="w-6 h-6 fill-amber-400" />
                    <span>{analytics.csat.average}</span>
                  </span>
                  <span className="text-xs text-muted">/ 5.0 Stars</span>
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  Based on verified post-ticket resolution ratings
                </div>
              </div>

              <div className="p-5 rounded-xl bg-card border border-border">
                <span className="text-xs font-medium text-muted">Ticket Status Distribution</span>
                <div className="mt-2 text-sm font-semibold text-foreground space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-accent">Open / In Progress:</span>
                    <span className="font-mono">{analytics.statusStats.open + analytics.statusStats.staffReply}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-warning">Awaiting Staff:</span>
                    <span className="font-mono">{analytics.statusStats.awaitingStaff}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-emerald-400">Resolved & Closed:</span>
                    <span className="font-mono">{analytics.statusStats.resolved + analytics.statusStats.closed}</span>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-card border border-border">
                <span className="text-xs font-medium text-muted">Priority Distribution</span>
                <div className="mt-2 text-sm font-semibold text-foreground space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-danger">Urgent:</span>
                    <span className="font-mono">{analytics.priorityStats.urgent}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-warning">High:</span>
                    <span className="font-mono">{analytics.priorityStats.high}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted">Medium & Low:</span>
                    <span className="font-mono">{analytics.priorityStats.medium + analytics.priorityStats.low}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="p-6 rounded-xl bg-card border border-border space-y-4">
              <h2 className="text-xs font-bold text-foreground font-mono">SUPPORT VOLUME BY CATEGORY</h2>

              <div className="space-y-3">
                {analytics.categoryStats.map((cat) => {
                  const maxCount = Math.max(...analytics.categoryStats.map((c) => c.count), 1);
                  const percentage = Math.round((cat.count / maxCount) * 100);

                  return (
                    <div key={cat.slug} className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-foreground font-medium flex items-center gap-1.5">
                          <span>{cat.emoji || "📁"}</span>
                          <span>{cat.name}</span>
                        </span>
                        <span className="font-mono text-accent">{cat.count} ticket(s)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[#0B0F19] overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-accent to-accent-light rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(percentage, 8)}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 7-Day Ticket Volume Activity */}
            <div className="p-6 rounded-xl bg-card border border-border space-y-4">
              <h2 className="text-xs font-bold text-foreground font-mono">7-DAY INCOMING TICKET VOLUME</h2>
              <div className="grid grid-cols-7 gap-2 text-center pt-4">
                {analytics.volumeHistory.map((d) => (
                  <div key={d.date} className="space-y-2">
                    <div className="h-28 bg-[#0B0F19] rounded-lg border border-border flex items-end justify-center p-2">
                      <div
                        className="w-full bg-accent/70 hover:bg-accent rounded transition-all"
                        style={{ height: `${Math.min(Math.max(d.count * 20, 10), 100)}%` }}
                      ></div>
                    </div>
                    <div className="text-[11px] font-mono text-muted">{d.date}</div>
                    <div className="text-xs font-bold font-mono text-foreground">{d.count}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}
