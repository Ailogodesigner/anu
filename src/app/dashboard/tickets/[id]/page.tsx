"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Ticket,
  ChevronLeft,
  User,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Send,
  FileText,
  Download,
  Shield,
  Bot,
  RefreshCw,
  ExternalLink,
  MessageSquare,
} from "lucide-react";

interface TicketDetail {
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
  escalatedAt: string | null;
  escalationReason: string | null;
  resolutionSummary: string | null;
  customerFeedbackRating: number | null;
  category: { id: string; name: string; emoji: string | null };
  assignedStaff: { id: string; username: string } | null;
  messages: Array<{
    id: string;
    senderUsername: string;
    senderDiscordId: string;
    isStaff: boolean;
    isBot: boolean;
    isAi: boolean;
    content: string;
    createdAt: string;
  }>;
  internalNotes: Array<{
    id: string;
    staffUsername: string;
    content: string;
    createdAt: string;
  }>;
  transcript: {
    id: string;
    markdownContent: string;
    htmlContent: string | null;
    firstResponseMinutes: number | null;
    durationMinutes: number | null;
  } | null;
}

interface StaffMember {
  id: string;
  username: string;
  role: string;
  status: string;
}

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [allStaff, setAllStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [replyContent, setReplyContent] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [addingNote, setAddingNote] = useState(false);

  // Resolve modal state
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolveSummary, setResolveSummary] = useState("");
  const [resolving, setResolving] = useState(false);

  // Escalate modal state
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [escalateReason, setEscalateReason] = useState("");
  const [escalating, setEscalating] = useState(false);

  const fetchTicket = async () => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}`);
      if (!res.ok) throw new Error("Ticket not found");
      const data = await res.json();
      setTicket(data.ticket);
    } catch (err) {
      console.error("Error fetching ticket:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
    fetch("/api/staff")
      .then((res) => res.json())
      .then((data) => setAllStaff(data.staff || []));
  }, [ticketId]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    setSendingReply(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyContent }),
      });
      if (res.ok) {
        setReplyContent("");
        fetchTicket();
      }
    } catch (err) {
      console.error("Error sending reply:", err);
    } finally {
      setSendingReply(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;
    setAddingNote(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: noteContent }),
      });
      if (res.ok) {
        setNoteContent("");
        fetchTicket();
      }
    } catch (err) {
      console.error("Error adding note:", err);
    } finally {
      setAddingNote(false);
    }
  };

  const handleAssign = async (staffId: string) => {
    try {
      await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedStaffId: staffId || null }),
      });
      fetchTicket();
    } catch (err) {
      console.error("Error assigning ticket:", err);
    }
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    setResolving(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "RESOLVED",
          resolutionSummary: resolveSummary || "Ticket resolved by staff via dashboard.",
        }),
      });
      if (res.ok) {
        setShowResolveModal(false);
        fetchTicket();
      }
    } catch (err) {
      console.error("Error resolving ticket:", err);
    } finally {
      setResolving(false);
    }
  };

  const handleEscalate = async (e: React.FormEvent) => {
    e.preventDefault();
    setEscalating(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "AWAITING_STAFF",
          escalationReason: escalateReason || "Escalated by staff member from dashboard console.",
        }),
      });
      if (res.ok) {
        setShowEscalateModal(false);
        fetchTicket();
      }
    } catch (err) {
      console.error("Error escalating ticket:", err);
    } finally {
      setEscalating(false);
    }
  };

  const handleReopen = async () => {
    try {
      await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "OPEN" }),
      });
      fetchTicket();
    } catch (err) {
      console.error("Error reopening ticket:", err);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-muted flex items-center justify-center gap-2">
        <RefreshCw className="w-4 h-4 animate-spin text-accent" />
        <span>Loading ticket conversation...</span>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="p-8 max-w-md mx-auto text-center space-y-4 my-8">
        <div className="w-12 h-12 rounded-xl bg-danger/10 border border-danger/20 text-danger flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-foreground">Ticket Record Not Found</h2>
          <p className="text-xs text-muted">
            The requested ticket identifier does not exist or has been permanently archived.
          </p>
        </div>
        <Link
          href="/dashboard/tickets"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-accent hover:bg-accent-hover text-black font-semibold text-xs transition shadow-glow"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Return to Queue</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back and Header Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/tickets"
            className="p-2 rounded-lg bg-card border border-border text-muted hover:text-foreground transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-accent">#{ticket.ticketNumber}</span>
              <span className="text-sm font-bold text-foreground">{ticket.title}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted mt-1">
              <span>{ticket.category.emoji} {ticket.category.name}</span>
              <span>&bull;</span>
              <span>Opened by {ticket.customerUsername}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {ticket.status !== "RESOLVED" && ticket.status !== "CLOSED" ? (
            <>
              <button
                onClick={() => setShowEscalateModal(true)}
                className="px-3 py-1.5 rounded-lg bg-warning/15 hover:bg-warning/25 border border-warning/30 text-warning text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Escalate</span>
              </button>
              <button
                onClick={() => setShowResolveModal(true)}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Resolve</span>
              </button>
            </>
          ) : (
            <button
              onClick={handleReopen}
              className="px-3 py-1.5 rounded-lg bg-accent/15 hover:bg-accent/25 border border-accent/30 text-accent text-xs font-semibold transition"
            >
              Reopen Ticket
            </button>
          )}

          <a
            href={`/api/tickets/${ticket.id}/transcript?format=html`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-card-secondary border border-border hover:border-accent text-foreground text-xs flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5 text-accent" />
            <span>Transcript</span>
          </a>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Conversation History & Reply Box */}
        <div className="lg:col-span-2 space-y-4">
          {/* Conversation Stream */}
          <div className="space-y-3">
            {ticket.messages.map((m) => {
              const isStaff = m.isStaff;
              const isAi = m.isAi;

              return (
                <div
                  key={m.id}
                  className={`p-4 rounded-xl border transition ${
                    isStaff
                      ? "bg-[#161F30] border-l-4 border-l-accent border-border"
                      : isAi
                      ? "bg-[#131C2D] border-l-4 border-l-accent-light border-border"
                      : "bg-[#0B0F19] border-border"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {isAi ? (
                        <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-accent">
                          <Bot className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-card-secondary flex items-center justify-center text-xs font-bold text-foreground">
                          {m.senderUsername.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <span className="text-xs font-bold text-foreground">{m.senderUsername}</span>
                      {isStaff && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-accent/15 text-accent border border-accent/20">
                          STAFF
                        </span>
                      )}
                      {isAi && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-accent-light/15 text-accent-light border border-accent-light/20">
                          AI ASSISTANT
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div className="text-xs text-[#E2E8F0] leading-relaxed whitespace-pre-wrap">{m.content}</div>
                </div>
              );
            })}
          </div>

          {/* Reply Form */}
          {ticket.status !== "RESOLVED" && ticket.status !== "CLOSED" ? (
            <form onSubmit={handleSendReply} className="p-4 rounded-xl bg-card border border-border space-y-3">
              <div className="flex items-center justify-between text-xs text-muted">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-accent" />
                  <span>Reply to Customer</span>
                </span>
                <span className="text-[11px] font-mono text-muted-foreground">Syncs with Discord channel</span>
              </div>
              <textarea
                rows={3}
                placeholder="Type your official technical response here..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="w-full p-3 rounded-lg bg-[#0B0F19] border border-border text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
              />
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted">Apex VPS Cloud &bull; Verified Staff Dispatch</span>
                <button
                  type="submit"
                  disabled={sendingReply || !replyContent.trim()}
                  className="px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-black font-semibold text-xs flex items-center gap-1.5 transition shadow-glow disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sendingReply ? "Sending..." : "Send Reply"}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="p-4 rounded-xl bg-card-secondary border border-border text-center text-xs text-muted">
              🔒 This ticket is resolved or closed. Reopen the ticket to post new replies.
            </div>
          )}
        </div>

        {/* Right Column (1 col): Metadata, Staff Internal Notes, Escalation Summary */}
        <div className="space-y-6">
          {/* Metadata Card */}
          <div className="p-5 rounded-xl bg-card border border-border space-y-4">
            <h3 className="text-xs font-bold text-muted uppercase tracking-wider font-mono">Ticket Metadata</h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted">Status</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium font-mono ${
                    ticket.status === "AWAITING_STAFF"
                      ? "bg-warning/15 text-warning border border-warning/30 animate-pulse"
                      : ticket.status === "RESOLVED"
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                      : "bg-accent/15 text-accent-light"
                  }`}
                >
                  {ticket.status.replace("_", " ")}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted">Priority</span>
                <span className="font-mono font-bold text-foreground">{ticket.priority}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted">Customer Discord ID</span>
                <span className="font-mono text-muted-foreground">{ticket.customerDiscordId}</span>
              </div>

              {/* Assignment Selector */}
              <div>
                <label className="block text-muted mb-1">Assigned Staff</label>
                <select
                  value={ticket.assignedStaff?.id || ""}
                  onChange={(e) => handleAssign(e.target.value)}
                  className="w-full py-1.5 px-2.5 rounded-lg bg-[#0B0F19] border border-border text-xs text-foreground focus:outline-none focus:border-accent"
                >
                  <option value="">Unassigned</option>
                  {allStaff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.username} ({s.status})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Escalation info if triggered */}
            {ticket.escalationReason && (
              <div className="p-3 rounded-lg bg-warning/10 border border-warning/30 text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-warning font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Escalation Notice</span>
                </div>
                <p className="text-[11px] text-muted-foreground">{ticket.escalationReason}</p>
              </div>
            )}

            {/* Resolution info if resolved */}
            {ticket.resolutionSummary && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Resolution Summary</span>
                </div>
                <p className="text-[11px] text-muted-foreground">{ticket.resolutionSummary}</p>
                {ticket.customerFeedbackRating && (
                  <div className="text-[11px] text-accent mt-1">
                    Customer Rating: {"★".repeat(ticket.customerFeedbackRating)}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Staff-Only Internal Notes */}
          <div className="p-5 rounded-xl bg-card border border-border space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-warning" />
                <span>Internal Staff Notes</span>
              </h3>
              <span className="text-[10px] text-muted font-mono">Invisible to customer</span>
            </div>

            {/* Existing Notes */}
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {ticket.internalNotes.length === 0 ? (
                <div className="text-[11px] text-muted text-center py-2">No internal notes yet.</div>
              ) : (
                ticket.internalNotes.map((n) => (
                  <div key={n.id} className="p-2.5 rounded-lg bg-[#0B0F19] border border-border text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-warning text-[11px]">{n.staffUsername}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#E2E8F0] whitespace-pre-wrap">{n.content}</div>
                  </div>
                ))
              )}
            </div>

            {/* Add Note Form */}
            <form onSubmit={handleAddNote} className="space-y-2">
              <textarea
                rows={2}
                placeholder="Add private staff observation or troubleshooting note..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                className="w-full p-2 rounded-lg bg-[#0B0F19] border border-border text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-warning"
              />
              <button
                type="submit"
                disabled={addingNote || !noteContent.trim()}
                className="w-full py-1.5 rounded-lg bg-card-secondary border border-border hover:border-warning text-foreground text-xs font-medium transition"
              >
                {addingNote ? "Adding Note..." : "Add Internal Note"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Resolve Ticket Modal */}
      {showResolveModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#161F30] border border-border rounded-xl shadow-card p-6 space-y-4">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Resolve Ticket #{ticket.ticketNumber}</span>
            </h3>
            <form onSubmit={handleResolve} className="space-y-3 text-xs">
              <div>
                <label className="block text-muted mb-1">Resolution Summary</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Summarize the corrective action taken (e.g. Cleared UFW rule, restarted sshd service via console)..."
                  value={resolveSummary}
                  onChange={(e) => setResolveSummary(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-[#0B0F19] border border-border text-foreground focus:outline-none focus:border-accent"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowResolveModal(false)}
                  className="px-3 py-2 rounded-lg bg-card-secondary text-muted hover:text-foreground text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resolving}
                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black font-semibold text-xs transition"
                >
                  {resolving ? "Resolving..." : "Confirm Resolution"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Escalate Ticket Modal */}
      {showEscalateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#161F30] border border-border rounded-xl shadow-card p-6 space-y-4">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              <span>Escalate Ticket #{ticket.ticketNumber} to Staff Lead</span>
            </h3>
            <form onSubmit={handleEscalate} className="space-y-3 text-xs">
              <div>
                <label className="block text-muted mb-1">Escalation Reason</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Hardware disk I/O errors or transit packet degradation requiring NetOps intervention..."
                  value={escalateReason}
                  onChange={(e) => setEscalateReason(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-[#0B0F19] border border-border text-foreground focus:outline-none focus:border-warning"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowEscalateModal(false)}
                  className="px-3 py-2 rounded-lg bg-card-secondary text-muted hover:text-foreground text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={escalating}
                  className="px-4 py-2 rounded-lg bg-warning hover:bg-warning/80 text-black font-semibold text-xs transition"
                >
                  {escalating ? "Escalating..." : "Confirm Escalation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
