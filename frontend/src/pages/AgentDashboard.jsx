import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  User,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  MessageSquare
} from "lucide-react";
import API from "../services/api";
import { TableSkeleton } from "../components/LoadingSkeleton";
import { TicketStatusBadge, PriorityBadge } from "../components/StatusBadge";

export default function AgentDashboard({ user }) {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await API.get("/tickets");
      setTickets(res.data.tickets || []);
    } catch (err) {
      console.error("Failed to load agent queue:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const escalatedTickets = tickets.filter((t) => t.status === "Escalated");
  const openUnassigned = tickets.filter((t) => t.status === "Open" && !t.assigned_agent_id);

  const handleClaimTicket = async (ticketId) => {
    try {
      await API.put(`/tickets/${ticketId}`, {
        assigned_agent_id: user.id,
        status: "In Progress"
      });
      fetchQueue();
    } catch (err) {
      alert("Failed to claim ticket.");
    }
  };

  if (loading) {
    return <TableSkeleton rows={6} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck size={20} className="text-amber-400" />
            <h1 className="text-2xl font-bold font-['Outfit'] text-white">Support Specialist Operations</h1>
          </div>
          <p className="text-sm text-slate-400">
            Escalation management, handoff triage, and priority customer assistance queue.
          </p>
        </div>
      </div>

      {/* Escalation Queue */}
      <div className="glass-panel p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert size={18} className="text-rose-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-['Outfit']">
              Priority Escalation Queue ({escalatedTickets.length})
            </h2>
          </div>
          <span className="text-xs text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800 font-semibold">
            Requires Human Attention
          </span>
        </div>

        {escalatedTickets.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs">
            <CheckCircle2 size={32} className="text-emerald-500 mx-auto mb-2" />
            <p className="text-slate-300 font-medium">All customer escalations resolved!</p>
            <p className="mt-0.5">The autonomous AI layer is successfully handling ongoing inquiries.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {escalatedTickets.map((t) => (
              <div
                key={t.id}
                className="glass-card p-4 border-rose-900/40 bg-rose-950/10 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-rose-400">{t.ticket_number}</span>
                    <TicketStatusBadge status={t.status} />
                    <PriorityBadge priority={t.priority} />
                    <span className="text-xs text-slate-400">• Customer: {t.customer_name}</span>
                  </div>

                  <h3 className="text-sm font-semibold text-white truncate">{t.title}</h3>
                  <p className="text-xs text-rose-300/80 mt-1 line-clamp-2">
                    Escalation Note: {t.escalation_reason || t.description}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleClaimTicket(t.id)}
                    className="glow-btn-primary px-3 py-1.5 rounded-lg text-xs font-semibold"
                  >
                    Claim Issue
                  </button>
                  <button
                    onClick={() => navigate(`/tickets/${t.id}`)}
                    className="glow-btn-secondary px-3 py-1.5 rounded-lg text-xs font-medium"
                  >
                    Inspect
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Unassigned Tickets */}
      <div className="glass-panel p-5 space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider font-['Outfit']">
          Unassigned Tickets ({openUnassigned.length})
        </h2>

        {openUnassigned.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">No unassigned tickets in queue.</p>
        ) : (
          <div className="space-y-2.5">
            {openUnassigned.map((t) => (
              <div
                key={t.id}
                onClick={() => navigate(`/tickets/${t.id}`)}
                className="glass-card p-3.5 flex items-center justify-between gap-4 cursor-pointer hover:border-slate-700"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-sky-400">{t.ticket_number}</span>
                    <PriorityBadge priority={t.priority} />
                    <span className="text-xs text-slate-400">{t.customer_name}</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-200 truncate">{t.title}</p>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClaimTicket(t.id);
                  }}
                  className="glow-btn-secondary px-3 py-1.5 rounded-lg text-xs shrink-0"
                >
                  Assign to Me
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
