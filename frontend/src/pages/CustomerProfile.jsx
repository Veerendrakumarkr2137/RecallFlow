import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Users,
  ArrowLeft,
  Mail,
  Building,
  Phone,
  Brain,
  MessageSquare,
  Ticket,
  Clock,
  Sparkles,
  ShieldAlert,
  CheckCircle2
} from "lucide-react";
import API from "../services/api";
import { TicketStatusBadge, PriorityBadge, MemoryConfidenceBadge } from "../components/StatusBadge";

export default function CustomerProfile() {
  const { customerId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCustomer() {
      setLoading(true);
      try {
        const res = await API.get(`/customers/${customerId}`);
        setData(res.data);
      } catch (err) {
        console.error("Failed to load customer profile:", err);
      } finally {
        setLoading(false);
      }
    }
    loadCustomer();
  }, [customerId]);

  if (loading) {
    return <div className="p-12 text-center text-slate-400">Loading Customer 360 profile...</div>;
  }

  if (!data) {
    return <div className="p-12 text-center text-rose-400">Customer not found.</div>;
  }

  const { customer, conversations, memories, tickets, timeline } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/customers")}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-purple-950 border border-purple-800/40 text-purple-300">
                {customer.tier} Tier Customer
              </span>
              <span className="text-xs text-slate-500 font-mono">ID #{customer.id}</span>
            </div>
            <h1 className="text-2xl font-bold font-['Outfit'] text-white">{customer.full_name}</h1>
          </div>
        </div>
      </div>

      {/* Customer Quick Stats & Info */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <p className="text-xs text-slate-400 font-semibold mb-1">Email Address</p>
          <p className="text-sm font-medium text-slate-200 truncate">{customer.email}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-slate-400 font-semibold mb-1">Company</p>
          <p className="text-sm font-medium text-slate-200">{customer.company || "Independent"}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-slate-400 font-semibold mb-1">Contact Phone</p>
          <p className="text-sm font-medium text-slate-200">{customer.phone || "Not recorded"}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-slate-400 font-semibold mb-1">Account Created</p>
          <p className="text-sm font-medium text-slate-200">
            {customer.created_at ? new Date(customer.created_at).toLocaleDateString() : ""}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Memory & Tickets Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Memories */}
          <div className="glass-panel p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Brain size={18} className="text-purple-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider font-['Outfit']">
                  Remembered Profile Facts ({memories.length})
                </h2>
              </div>
            </div>

            <div className="space-y-2.5">
              {memories.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No memories recorded for this customer.</p>
              ) : (
                memories.map((m) => (
                  <div key={m.id} className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                    <div className="flex items-center justify-between text-purple-400 font-semibold mb-1">
                      <span>{m.category}</span>
                      <MemoryConfidenceBadge confidence={m.confidence} />
                    </div>
                    <p className="text-slate-300 leading-relaxed">{m.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Past Conversations */}
          <div className="glass-panel p-5">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-['Outfit'] mb-4 flex items-center gap-2">
              <MessageSquare size={18} className="text-sky-400" />
              <span>Conversation History ({conversations.length})</span>
            </h2>

            <div className="space-y-2.5">
              {conversations.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No conversations found.</p>
              ) : (
                conversations.map((c) => (
                  <Link
                    key={c.id}
                    to={`/chat/${c.id}`}
                    className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-sky-500/40 flex items-center justify-between text-xs text-slate-200 transition-colors block"
                  >
                    <span className="font-medium truncate max-w-md">{c.title}</span>
                    <span className="text-[11px] text-slate-500 shrink-0">
                      {c.updated_at ? new Date(c.updated_at).toLocaleDateString() : ""}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Chronological Activity Timeline */}
        <div className="glass-panel p-5 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider font-['Outfit'] flex items-center gap-2">
            <Clock size={17} className="text-indigo-400" />
            <span>Activity Timeline</span>
          </h2>

          <div className="space-y-3 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-slate-800">
            {timeline.map((item, idx) => (
              <div key={idx} className="relative pl-6 text-xs">
                <span className="absolute left-1 top-1.5 w-2 h-2 rounded-full bg-purple-500 ring-4 ring-[#0b0f19]"></span>
                <p className="font-semibold text-slate-200">{item.title}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {item.date ? new Date(item.date).toLocaleString() : ""}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
