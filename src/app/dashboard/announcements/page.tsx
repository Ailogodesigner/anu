"use client";

import React, { useEffect, useState } from "react";
import {
  Megaphone,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  Send,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  channelId: string;
  channelName: string | null;
  scheduledFor: string;
  status: "PENDING" | "APPROVED" | "EXECUTED" | "CANCELLED" | "FAILED";
  approvedBy: string | null;
  executedAt: string | null;
  executionResult: string | null;
  retryCount: number;
  idempotencyKey: string;
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [channelId, setChannelId] = useState("");
  const [channelName, setChannelName] = useState("announcements");
  const [scheduledFor, setScheduledFor] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch("/api/announcements");
      const data = await res.json();
      setAnnouncements(data.announcements || []);
    } catch (err) {
      console.error("Error fetching announcements:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          channelId,
          channelName,
          scheduledFor: new Date(scheduledFor).toISOString(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setShowModal(false);
        setTitle("");
        setContent("");
        setChannelId("");
        fetchAnnouncements();
      } else {
        setFormError(data.error || "Failed to schedule announcement");
      }
    } catch (err: any) {
      setFormError(err.message || "Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await fetch(`/api/announcements/${id}/approve`, { method: "PATCH" });
      fetchAnnouncements();
    } catch (err) {
      console.error("Approve error:", err);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this scheduled announcement?")) return;
    try {
      await fetch(`/api/announcements/${id}/cancel`, { method: "PATCH" });
      fetchAnnouncements();
    } catch (err) {
      console.error("Cancel error:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-accent" />
            <span>Announcement Scheduler & Dispatch</span>
          </h1>
          <p className="text-xs text-muted mt-1">
            Durable cron queue delivery, dual-staff approval workflow, and duplicate prevention.
          </p>
        </div>

        <button
          onClick={() => {
            // Set default date to +1 hour
            const d = new Date(Date.now() + 3600 * 1000);
            setScheduledFor(d.toISOString().slice(0, 16));
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-accent hover:bg-accent-hover text-black font-semibold text-xs transition shadow-glow self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Announcement</span>
        </button>
      </div>

      {/* Announcements Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-subtle">
        {loading ? (
          <div className="p-8 text-center text-xs text-muted flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-accent" />
            <span>Loading scheduled queue...</span>
          </div>
        ) : announcements.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-card-secondary border border-border flex items-center justify-center mx-auto text-muted">
              <Megaphone className="w-6 h-6" />
            </div>
            <div className="text-sm font-semibold text-foreground">No Announcements Scheduled</div>
            <p className="text-xs text-muted max-w-sm mx-auto">
              The persistent announcement queue is currently empty. Click Schedule Announcement to queue a notice.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0B0F19] text-muted border-b border-border uppercase font-mono text-[10px]">
                <tr>
                  <th className="py-3 px-4">Title & Content</th>
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4">Scheduled For</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Approval</th>
                  <th className="py-3 px-4">Delivery Result</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {announcements.map((a) => (
                  <tr key={a.id} className="hover:bg-card-secondary/50 transition">
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-semibold text-foreground">{a.title}</div>
                      <div className="text-[11px] text-muted line-clamp-1 mt-0.5">{a.content}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-muted text-[11px]">
                      #{a.channelName || a.channelId}
                    </td>
                    <td className="py-3 px-4 font-mono text-muted text-[11px]">
                      {new Date(a.scheduledFor).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          a.status === "APPROVED"
                            ? "bg-accent/15 text-accent border border-accent/30"
                            : a.status === "EXECUTED"
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : a.status === "CANCELLED"
                            ? "bg-slate-700/20 text-muted"
                            : a.status === "FAILED"
                            ? "bg-danger/15 text-danger border border-danger/30"
                            : "bg-warning/15 text-warning border border-warning/30"
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted text-[11px]">
                      {a.approvedBy ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>{a.approvedBy}</span>
                        </span>
                      ) : (
                        <span className="text-warning">Pending Review</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-muted text-[11px] max-w-xs truncate">
                      {a.executionResult || (a.status === "APPROVED" ? "Queued for worker execution" : "Awaiting approval")}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {a.status === "PENDING" && (
                          <button
                            onClick={() => handleApprove(a.id)}
                            className="px-2.5 py-1 rounded bg-accent/15 hover:bg-accent/25 text-accent border border-accent/30 text-[11px] font-medium transition"
                          >
                            Approve
                          </button>
                        )}
                        {(a.status === "PENDING" || a.status === "APPROVED") && (
                          <button
                            onClick={() => handleCancel(a.id)}
                            className="px-2 py-1 rounded bg-danger/10 hover:bg-danger/20 text-danger border border-danger/20 text-[11px] font-medium transition"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#161F30] border border-border rounded-xl shadow-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4 text-accent" />
                <span>Schedule Announcement Delivery</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-muted hover:text-foreground text-xs">
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-danger/10 border border-danger/30 text-xs text-danger flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block text-muted mb-1">Notice Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Scheduled Hypervisor Node Upgrade"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-[#0B0F19] border border-border text-foreground focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-muted mb-1">Target Discord Channel ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 990000000000000004"
                  value={channelId}
                  onChange={(e) => setChannelId(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-[#0B0F19] border border-border text-foreground font-mono focus:outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted mb-1">Channel Label</label>
                  <input
                    type="text"
                    value={channelName}
                    onChange={(e) => setChannelName(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-[#0B0F19] border border-border text-foreground focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-muted mb-1">Delivery Time (UTC/Local)</label>
                  <input
                    type="datetime-local"
                    required
                    value={scheduledFor}
                    onChange={(e) => setScheduledFor(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-[#0B0F19] border border-border text-foreground focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-muted mb-1">Announcement Message Body</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Enter the official notification text..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-[#0B0F19] border border-border text-foreground focus:outline-none focus:border-accent"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-2 rounded-lg bg-card-secondary text-muted hover:text-foreground text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-black font-semibold text-xs transition shadow-glow"
                >
                  {submitting ? "Scheduling..." : "Schedule Notice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
