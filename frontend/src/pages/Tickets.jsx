import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Ticket,
  Plus,
  Search,
  Filter,
  Clock,
  User,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  X
} from "lucide-react";
import API from "../services/api";
import { TableSkeleton } from "../components/LoadingSkeleton";
import { TicketStatusBadge, PriorityBadge } from "../components/StatusBadge";

export default function Tickets({ user }) {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState("all");
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Technical",
    priority: "Medium"
  });
  const [creating, setCreating] = useState(false);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await API.get("/tickets");
      setTickets(res.data.tickets || []);
    } catch (err) {
      console.error("Failed to fetch tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await API.post("/tickets", form);
      setTickets((prev) => [res.data, ...prev]);
      setIsCreateOpen(false);
      setForm({ title: "", description: "", category: "Technical", priority: "Medium" });
    } catch (err) {
      alert("Failed to create support ticket.");
    } finally {
      setCreating(false);
    }
  };

  // Filter tickets by status tab and search
  const filteredTickets = tickets.filter((t) => {
    const matchesTab =
      statusTab === "all" ||
      (statusTab === "open" && t.status === "Open") ||
      (statusTab === "in_progress" && (t.status === "In Progress" || t.status === "Pending")) ||
      (statusTab === "escalated" && t.status === "Escalated") ||
      (statusTab === "resolved" && t.status === "Resolved");

    const matchesSearch =
      !search ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.ticket_number.toLowerCase().includes(search.toLowerCase()) ||
      (t.customer_name && t.customer_name.toLowerCase().includes(search.toLowerCase()));

    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Ticket size={20} className="text-sky-400" />
            <h1 className="text-2xl font-bold font-['Outfit'] text-white">Support Tickets</h1>
          </div>
          <p className="text-sm text-slate-400">
            Track, assign, and resolve multi-tier support inquiries across your organization.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="glow-btn-primary flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold shrink-0"
        >
          <Plus size={16} />
          <span>Open New Ticket</span>
        </button>
      </div>

      {/* Filter and Status Tabs */}
      <div className="glass-panel p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {[
            { id: "all", label: "All Tickets", count: tickets.length },
            { id: "open", label: "Open", count: tickets.filter((t) => t.status === "Open").length },
            { id: "escalated", label: "Escalated", count: tickets.filter((t) => t.status === "Escalated").length },
            { id: "in_progress", label: "In Progress", count: tickets.filter((t) => t.status === "In Progress" || t.status === "Pending").length },
            { id: "resolved", label: "Resolved", count: tickets.filter((t) => t.status === "Resolved").length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusTab === tab.id
                  ? "bg-purple-950/80 border border-purple-500 text-purple-300"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search tickets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input pl-9 py-1.5 text-xs"
          />
        </div>
      </div>

      {/* Tickets List */}
      {loading ? (
        <TableSkeleton rows={5} />
      ) : filteredTickets.length === 0 ? (
        <div className="glass-panel p-12 text-center">
          <Ticket size={40} className="text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No Support Tickets Found</h3>
          <p className="text-xs text-slate-400">There are no tickets matching your active filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTickets.map((t) => (
            <div
              key={t.id}
              onClick={() => navigate(`/tickets/${t.id}`)}
              className="glass-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:border-purple-500/50 transition-all"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-mono text-xs font-bold text-sky-400">{t.ticket_number}</span>
                  <TicketStatusBadge status={t.status} />
                  <PriorityBadge priority={t.priority} />
                  <span className="text-xs text-slate-400">• {t.category}</span>
                </div>

                <h3 className="text-sm font-semibold text-white truncate">{t.title}</h3>
                <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{t.description}</p>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-400 shrink-0">
                <div className="text-right">
                  <p className="text-slate-300 font-medium">{t.assigned_agent_name || "Unassigned"}</p>
                  <p className="text-[10px] text-slate-500">
                    {t.created_at ? new Date(t.created_at).toLocaleDateString() : ""}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Ticket Modal */}
      {isCreateOpen && (
        <div className="modal-overlay">
          <div className="modal-content relative">
            <button
              onClick={() => setIsCreateOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-bold text-white mb-1">Create Support Ticket</h3>
            <p className="text-xs text-slate-400 mb-4">
              Open a structured issue ticket for human support investigation.
            </p>

            <form onSubmit={handleCreateTicket} className="space-y-3.5">
              <div>
                <label className="form-label">Subject / Issue Title</label>
                <input
                  type="text"
                  placeholder="e.g., Battery fails diagnostic test after update"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="form-select"
                  >
                    <option value="Technical">Technical</option>
                    <option value="Hardware">Hardware</option>
                    <option value="Billing">Billing</option>
                    <option value="Account">Account</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="form-select"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">Detailed Description</label>
                <textarea
                  placeholder="Provide any specific symptoms or error codes observed..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="form-textarea h-28"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="glow-btn-secondary px-4 py-2 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="glow-btn-primary px-4 py-2 rounded-lg text-xs font-semibold"
                >
                  {creating ? "Submitting..." : "Submit Ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
