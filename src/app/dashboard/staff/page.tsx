"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  Shield,
  Star,
  Ticket,
  Clock,
  Plus,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Power,
} from "lucide-react";

interface StaffMember {
  id: string;
  discordId: string;
  username: string;
  avatar: string | null;
  role: "ADMIN" | "SUPPORT_LEAD" | "SUPPORT_AGENT" | "VIEWER";
  status: "ONLINE" | "BUSY" | "OFFLINE" | "ON_BREAK";
  activeTicketsCount: number;
  totalResolvedTickets: number;
  avgRating: number;
  lastActiveAt: string | null;
  assignedTickets: Array<{ id: string; ticketNumber: number; priority: string; status: string }>;
}

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  // New staff modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDiscordId, setNewDiscordId] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newRole, setNewRole] = useState<"ADMIN" | "SUPPORT_LEAD" | "SUPPORT_AGENT">("SUPPORT_AGENT");

  const fetchStaff = async () => {
    try {
      const res = await fetch("/api/staff");
      const data = await res.json();
      setStaff(data.staff || []);
    } catch (err) {
      console.error("Staff fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await fetch(`/api/staff/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchStaff();
    } catch (err) {
      console.error("Status change error:", err);
    }
  };

  const handleRoleChange = async (id: string, newRole: string) => {
    try {
      await fetch(`/api/staff/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      fetchStaff();
    } catch (err) {
      console.error("Role change error:", err);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discordId: newDiscordId,
          username: newUsername,
          role: newRole,
          status: "ONLINE",
        }),
      });
      if (res.ok) {
        setShowAddModal(false);
        setNewDiscordId("");
        setNewUsername("");
        fetchStaff();
      }
    } catch (err) {
      console.error("Add staff error:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="w-5 h-5 text-accent" />
            <span>Staff Directory, Availability & Workload</span>
          </h1>
          <p className="text-xs text-muted mt-1">
            Real-time on-duty status, support role delegation, and resolution benchmarks.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-accent hover:bg-accent-hover text-black font-semibold text-xs transition shadow-glow self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Staff Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full p-8 text-center text-xs text-muted flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-accent" />
            <span>Loading staff roster...</span>
          </div>
        ) : (
          staff.map((s) => (
            <div
              key={s.id}
              className="p-5 rounded-xl bg-card border border-border hover:border-accent/40 shadow-subtle transition space-y-4 flex flex-col justify-between"
            >
              <div>
                {/* User Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#0B0F19] border border-border flex items-center justify-center font-bold text-accent">
                      {s.username.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                        <span>{s.username}</span>
                        {s.role === "ADMIN" && <Shield className="w-3.5 h-3.5 text-accent" />}
                      </div>
                      <div className="text-[11px] font-mono text-muted">{s.discordId}</div>
                    </div>
                  </div>

                  {/* Status Indicator Badge */}
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      s.status === "ONLINE"
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        : s.status === "BUSY"
                        ? "bg-warning/15 text-warning border border-warning/30"
                        : "bg-slate-700/20 text-muted"
                    }`}
                  >
                    {s.status}
                  </span>
                </div>

                {/* Workload Stats */}
                <div className="grid grid-cols-3 gap-2 mt-4 p-3 rounded-lg bg-[#0B0F19] border border-border text-center">
                  <div>
                    <div className="text-[10px] text-muted">Active</div>
                    <div className="text-sm font-bold text-accent font-mono mt-0.5">{s.activeTicketsCount}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted">Resolved</div>
                    <div className="text-sm font-bold text-foreground font-mono mt-0.5">{s.totalResolvedTickets}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted">Rating</div>
                    <div className="text-sm font-bold text-amber-400 font-mono mt-0.5 flex items-center justify-center gap-0.5">
                      <Star className="w-3 h-3 fill-amber-400" />
                      <span>{s.avgRating}</span>
                    </div>
                  </div>
                </div>

                {/* Assigned Tickets Pill List */}
                {s.assignedTickets?.length > 0 && (
                  <div className="mt-3">
                    <div className="text-[10px] text-muted mb-1">Currently Handling:</div>
                    <div className="flex flex-wrap gap-1">
                      {s.assignedTickets.map((t) => (
                        <span
                          key={t.id}
                          className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent/10 border border-accent/20 text-accent-light"
                        >
                          #{t.ticketNumber} ({t.priority})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Status & Role Controls */}
              <div className="pt-3 border-t border-border flex items-center justify-between gap-2 text-xs">
                {/* Status Switcher */}
                <select
                  value={s.status}
                  onChange={(e) => handleStatusChange(s.id, e.target.value)}
                  className="py-1 px-2 rounded bg-[#0B0F19] border border-border text-[11px] text-foreground font-mono focus:outline-none focus:border-accent"
                >
                  <option value="ONLINE">🟢 Online</option>
                  <option value="BUSY">🟡 Busy</option>
                  <option value="ON_BREAK">☕ On Break</option>
                  <option value="OFFLINE">⚪ Offline</option>
                </select>

                {/* Role Switcher */}
                <select
                  value={s.role}
                  onChange={(e) => handleRoleChange(s.id, e.target.value)}
                  className="py-1 px-2 rounded bg-[#0B0F19] border border-border text-[11px] text-muted font-mono focus:outline-none focus:border-accent"
                >
                  <option value="ADMIN">ADMIN</option>
                  <option value="SUPPORT_LEAD">SUPPORT_LEAD</option>
                  <option value="SUPPORT_AGENT">SUPPORT_AGENT</option>
                  <option value="VIEWER">VIEWER</option>
                </select>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#161F30] border border-border rounded-xl shadow-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Users className="w-4 h-4 text-accent" />
                <span>Register Staff Member</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-muted hover:text-foreground text-xs">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="space-y-4 text-xs">
              <div>
                <label className="block text-muted mb-1">Staff Username</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jordan_NetOps"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-[#0B0F19] border border-border text-foreground focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-muted mb-1">Discord User ID (Snowflake)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 100000000000000004"
                  value={newDiscordId}
                  onChange={(e) => setNewDiscordId(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-[#0B0F19] border border-border text-foreground font-mono focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-muted mb-1">Access Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full p-2.5 rounded-lg bg-[#0B0F19] border border-border text-foreground focus:outline-none focus:border-accent"
                >
                  <option value="SUPPORT_AGENT">Support Agent (Handle Tickets)</option>
                  <option value="SUPPORT_LEAD">Support Lead (Escalations & Approvals)</option>
                  <option value="ADMIN">Administrator (Full System Control)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 rounded-lg bg-card-secondary text-muted hover:text-foreground text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-black font-semibold text-xs transition shadow-glow"
                >
                  Register Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
