"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Ticket,
  Search,
  Filter,
  PlusCircle,
  Clock,
  AlertTriangle,
  UserCheck,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  MessageSquare,
  FileText,
} from "lucide-react";

interface TicketItem {
  id: string;
  ticketNumber: number;
  title: string;
  status: string;
  priority: string;
  customerUsername: string;
  customerDiscordId: string;
  createdAt: string;
  claimedAt: string | null;
  resolvedAt: string | null;
  category: { id: string; name: string; emoji: string | null };
  assignedStaff: { id: string; username: string } | null;
  _count: { messages: number; internalNotes: number };
}

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
  emoji: string | null;
}

export default function TicketQueuePage() {
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  // Create ticket modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newPriority, setNewPriority] = useState("MEDIUM");
  const [newCustomer, setNewCustomer] = useState("");
  const [newCustomerDiscordId, setNewCustomerDiscordId] = useState("");
  const [newInitialMsg, setNewInitialMsg] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (search) query.set("search", search);
      if (statusFilter !== "ALL") query.set("status", statusFilter);
      if (priorityFilter !== "ALL") query.set("priority", priorityFilter);
      if (categoryFilter !== "ALL") query.set("categoryId", categoryFilter);

      const res = await fetch(`/api/tickets?${query.toString()}`);
      const data = await res.json();
      setTickets(data.tickets || []);
    } catch (err) {
      console.error("Tickets fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, priorityFilter, categoryFilter]);

  useEffect(() => {
    fetch("/api/config")
      .then((res) => res.json())
      .then((data) => {
        if (data.categories) {
          setCategories(data.categories);
          if (data.categories.length > 0) {
            setNewCategory(data.categories[0].id);
          }
        }
      });
  }, []);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          categoryId: newCategory,
          priority: newPriority,
          customerUsername: newCustomer,
          customerDiscordId: newCustomerDiscordId || undefined,
          initialMessage: newInitialMsg || newTitle,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowCreateModal(false);
        setNewTitle("");
        setNewCustomer("");
        setNewInitialMsg("");
        fetchTickets();
      }
    } catch (err) {
      console.error("Create ticket error:", err);
    } finally {
      setCreating(false);
    }
  };

  const handleClaim = async (ticketId: string) => {
    try {
      await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "STAFF_REPLY" }),
      });
      fetchTickets();
    } catch (err) {
      console.error("Claim error:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Ticket className="w-5 h-5 text-accent" />
            <span>Support Ticket Queue</span>
          </h1>
          <p className="text-xs text-muted mt-1">
            Real-time VPS technical inquiries, diagnostic logs, and staff handoff workflows.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-accent hover:bg-accent-hover text-black font-semibold text-xs transition shadow-glow self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Ticket</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-card border border-border space-y-3">
        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {["ALL", "OPEN", "AWAITING_STAFF", "STAFF_REPLY", "RESOLVED", "CLOSED"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium font-mono transition ${
                statusFilter === s
                  ? "bg-accent/15 border border-accent/40 text-accent font-semibold"
                  : "bg-[#0B0F19] text-muted hover:text-foreground border border-border"
              }`}
            >
              {s.replace("_", " ")}
            </button>
          ))}
        </div>

        {/* Search & Dropdown Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
          {/* Search Input */}
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search by ticket #, customer, title or error..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchTickets()}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#0B0F19] border border-border text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
            />
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full py-2 px-3 rounded-lg bg-[#0B0F19] border border-border text-xs text-foreground focus:outline-none focus:border-accent"
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">Urgent Priority</option>
              <option value="HIGH">High Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="LOW">Low Priority</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full py-2 px-3 rounded-lg bg-[#0B0F19] border border-border text-xs text-foreground focus:outline-none focus:border-accent"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji} {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Ticket List Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-subtle">
        {loading ? (
          <div className="p-8 text-center text-xs text-muted flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-accent" />
            <span>Loading tickets...</span>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-card-secondary border border-border flex items-center justify-center mx-auto text-muted">
              <Ticket className="w-6 h-6" />
            </div>
            <div className="text-sm font-semibold text-foreground">No Tickets Found</div>
            <p className="text-xs text-muted max-w-sm mx-auto">
              No tickets matched your current search filters. Try clearing filters or create a new ticket.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0B0F19] text-muted border-b border-border uppercase font-mono text-[10px]">
                <tr>
                  <th className="py-3 px-4">Ticket</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Activity</th>
                  <th className="py-3 px-4">Assigned</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-card-secondary/50 transition">
                    <td className="py-3 px-4">
                      <Link
                        href={`/dashboard/tickets/${t.id}`}
                        className="font-semibold text-foreground hover:text-accent flex items-center gap-1.5"
                      >
                        <span className="font-mono text-accent">#{t.ticketNumber}</span>
                        <span className="truncate max-w-[200px]">{t.title}</span>
                      </Link>
                      <div className="text-[11px] text-muted mt-0.5 font-mono">
                        {new Date(t.createdAt).toLocaleDateString()} at {new Date(t.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
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
                            ? "bg-warning/15 text-warning border border-warning/30 animate-pulse"
                            : t.status === "RESOLVED"
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : t.status === "CLOSED"
                            ? "bg-slate-700/20 text-muted"
                            : "bg-accent/15 text-accent-light border border-accent/30"
                        }`}
                      >
                        {t.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-foreground">
                      {t.customerUsername}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3 text-muted text-[11px]">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3 text-accent" />
                          <span>{t._count.messages}</span>
                        </span>
                        {t._count.internalNotes > 0 && (
                          <span className="flex items-center gap-1 text-warning">
                            <FileText className="w-3 h-3" />
                            <span>{t._count.internalNotes}</span>
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted">
                      {t.assignedStaff ? (
                        <span className="text-foreground font-medium">{t.assignedStaff.username}</span>
                      ) : (
                        <span className="text-muted-foreground font-mono text-[11px]">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!t.assignedStaff && t.status !== "RESOLVED" && t.status !== "CLOSED" && (
                          <button
                            onClick={() => handleClaim(t.id)}
                            className="px-2 py-1 rounded bg-accent/10 border border-accent/20 hover:bg-accent/20 text-accent text-[11px] font-medium transition"
                          >
                            Claim
                          </button>
                        )}
                        <Link
                          href={`/dashboard/tickets/${t.id}`}
                          className="px-2.5 py-1 rounded bg-card-secondary border border-border hover:border-accent text-foreground text-[11px] transition"
                        >
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#161F30] border border-border rounded-xl shadow-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Ticket className="w-4 h-4 text-accent" />
                <span>Create New VPS Support Ticket</span>
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-muted hover:text-foreground text-xs">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
              <div>
                <label className="block text-muted mb-1">Issue Summary / Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cannot ping VPS gateway IP after reboot"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-[#0B0F19] border border-border text-foreground focus:outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-[#0B0F19] border border-border text-foreground focus:outline-none focus:border-accent"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.emoji} {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-muted mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-[#0B0F19] border border-border text-foreground focus:outline-none focus:border-accent"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent (SLA)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted mb-1">Customer Username</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ServerAdmin_Alex"
                    value={newCustomer}
                    onChange={(e) => setNewCustomer(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-[#0B0F19] border border-border text-foreground focus:outline-none focus:border-accent"
                  >
                  </input>
                </div>
                <div>
                  <label className="block text-muted mb-1">Discord ID (Optional)</label>
                  <input
                    type="text"
                    placeholder="18-digit Discord ID"
                    value={newCustomerDiscordId}
                    onChange={(e) => setNewCustomerDiscordId(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-[#0B0F19] border border-border text-foreground focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-muted mb-1">Initial Customer Message / Error Log</label>
                <textarea
                  rows={3}
                  placeholder="Paste terminal error or customer report description..."
                  value={newInitialMsg}
                  onChange={(e) => setNewInitialMsg(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-[#0B0F19] border border-border text-foreground focus:outline-none focus:border-accent"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-2 rounded-lg bg-card-secondary border border-border text-muted hover:text-foreground text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-black font-semibold text-xs transition shadow-glow"
                >
                  {creating ? "Creating..." : "Create Ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
