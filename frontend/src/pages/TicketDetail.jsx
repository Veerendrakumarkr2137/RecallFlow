import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Ticket,
  ArrowLeft,
  User,
  Clock,
  Send,
  Lock,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import API from "../services/api";
import { TicketStatusBadge, PriorityBadge } from "../components/StatusBadge";

export default function TicketDetail({ user }) {
  const { ticketId } = useParams();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  // Agent editable fields
  const [status, setStatus] = useState("Open");
  const [internalNotes, setInternalNotes] = useState("");
  const [resolutionSummary, setResolutionSummary] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  const isAgent = user?.role === "agent" || user?.role === "admin";

  const fetchTicket = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/tickets/${ticketId}`);
      setTicket(res.data);
      setStatus(res.data.status);
      setInternalNotes(res.data.internal_notes || "");
      setResolutionSummary(res.data.resolution_summary || "");
    } catch (err) {
      console.error("Failed to load ticket:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [ticketId]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || submittingComment) return;
    setSubmittingComment(true);

    try {
      const res = await API.post(`/tickets/${ticketId}/comments`, {
        content: newComment.trim(),
        is_internal: isInternalComment
      });
      setTicket((prev) => ({
        ...prev,
        comments: [...(prev.comments || []), res.data]
      }));
      setNewComment("");
      setIsInternalComment(false);
    } catch (err) {
      alert("Failed to post comment.");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleUpdateTicket = async (newStatusOverride = null) => {
    setSavingNotes(true);
    const targetStatus = newStatusOverride || status;
    try {
      const res = await API.put(`/tickets/${ticketId}`, {
        status: targetStatus,
        internal_notes: internalNotes,
        resolution_summary: resolutionSummary
      });
      setTicket(res.data);
      setStatus(res.data.status);
      alert("Ticket updated successfully!");
    } catch (err) {
      alert("Failed to update ticket.");
    } finally {
      setSavingNotes(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-400">Loading ticket details...</div>;
  }

  if (!ticket) {
    return <div className="p-12 text-center text-rose-400">Support ticket not found.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="glass-panel p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/tickets")}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold text-sky-400">{ticket.ticket_number}</span>
              <TicketStatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
            </div>
            <h1 className="text-xl font-bold text-white">{ticket.title}</h1>
          </div>
        </div>

        {ticket.conversation_id && (
          <Link
            to={`/chat/${ticket.conversation_id}`}
            className="glow-btn-secondary px-3.5 py-2 rounded-lg text-xs font-medium flex items-center gap-2 shrink-0"
          >
            <MessageSquare size={14} className="text-sky-400" />
            <span>View Linked AI Chat</span>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Discussion and Description */}
        <div className="lg:col-span-2 space-y-6">
          {/* Issue Description Card */}
          <div className="glass-panel p-5">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Issue Description</h2>
            <p className="text-sm text-slate-200 whitespace-pre-line leading-relaxed">{ticket.description}</p>

            {ticket.resolution_summary && (
              <div className="mt-4 p-3.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-200 text-xs">
                <p className="font-semibold text-emerald-400 mb-1 flex items-center gap-1.5">
                  <CheckCircle2 size={14} /> Resolution Summary:
                </p>
                <p className="whitespace-pre-line">{ticket.resolution_summary}</p>
              </div>
            )}
          </div>

          {/* Comments & Activity Stream */}
          <div className="glass-panel p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Activity & Responses</h2>

            <div className="space-y-3">
              {(ticket.comments || []).length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No comments posted yet.</p>
              ) : (
                ticket.comments.map((c) => (
                  <div
                    key={c.id}
                    className={`p-3.5 rounded-xl border text-xs ${
                      c.is_internal
                        ? "bg-amber-950/30 border-amber-800/50 text-amber-200"
                        : "bg-slate-900/70 border-slate-800 text-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5 font-semibold">
                      <div className="flex items-center gap-2">
                        <span className={c.is_internal ? "text-amber-400" : "text-sky-400"}>
                          {c.author_name}
                        </span>
                        <span className="text-[10px] text-slate-400 capitalize">({c.author_role})</span>
                        {c.is_internal && (
                          <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-950 px-1.5 py-0.5 rounded border border-amber-800">
                            <Lock size={10} /> Internal Note
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 font-normal">
                        {c.created_at ? new Date(c.created_at).toLocaleString() : ""}
                      </span>
                    </div>
                    <p className="whitespace-pre-line leading-relaxed">{c.content}</p>
                  </div>
                ))
              )}
            </div>

            {/* Comment Form */}
            <form onSubmit={handleAddComment} className="pt-4 border-t border-slate-800 space-y-3">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a response or note..."
                className="form-textarea h-20 text-xs"
                required
              />

              <div className="flex items-center justify-between">
                {isAgent ? (
                  <label className="flex items-center gap-2 text-xs text-amber-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isInternalComment}
                      onChange={(e) => setIsInternalComment(e.target.checked)}
                      className="rounded bg-slate-900 border-slate-800"
                    />
                    <span>Post as Internal Note (Staff only)</span>
                  </label>
                ) : (
                  <div></div>
                )}

                <button
                  type="submit"
                  disabled={submittingComment || !newComment.trim()}
                  className="glow-btn-primary px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                >
                  <Send size={13} />
                  <span>{submittingComment ? "Posting..." : "Post Response"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar Info & Controls */}
        <div className="space-y-6">
          {/* Customer Metadata Card */}
          <div className="glass-panel p-5 space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Customer Details</h3>
            <div>
              <p className="text-sm font-bold text-white">{ticket.customer_name}</p>
              <p className="text-xs text-slate-400">{ticket.customer_email}</p>
            </div>
            <div className="pt-2 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
              <span>Category</span>
              <span className="text-slate-200 font-medium">{ticket.category}</span>
            </div>
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>Assigned Agent</span>
              <span className="text-slate-200 font-medium">{ticket.assigned_agent_name || "Unassigned"}</span>
            </div>
          </div>

          {/* Agent Workflow Controls */}
          {isAgent && (
            <div className="glass-panel p-5 space-y-4">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 text-purple-400">
                <ShieldCheck size={14} /> Support Ops Controls
              </h3>

              <div>
                <label className="form-label text-xs">Update Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="form-select text-xs py-1.5"
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Pending">Pending</option>
                  <option value="Escalated">Escalated</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>

              <div>
                <label className="form-label text-xs">Internal Notes (Visible to agents)</label>
                <textarea
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="Record diagnosis steps, internal logs, or vendor ticket references..."
                  className="form-textarea h-24 text-xs"
                />
              </div>

              <div>
                <label className="form-label text-xs">Resolution Summary</label>
                <textarea
                  value={resolutionSummary}
                  onChange={(e) => setResolutionSummary(e.target.value)}
                  placeholder="Summarize the final solution delivered to the customer..."
                  className="form-textarea h-20 text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleUpdateTicket()}
                  disabled={savingNotes}
                  className="glow-btn-primary flex-1 py-2 rounded-lg text-xs font-semibold"
                >
                  {savingNotes ? "Saving..." : "Save Ticket"}
                </button>
                {status !== "Resolved" && (
                  <button
                    type="button"
                    onClick={() => handleUpdateTicket("Resolved")}
                    className="px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white"
                  >
                    Mark Resolved
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
