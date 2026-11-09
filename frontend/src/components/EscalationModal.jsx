import React, { useState } from "react";
import { ShieldAlert, AlertTriangle, CheckCircle2, X } from "lucide-react";
import API from "../services/api";

export default function EscalationModal({ conversationId, isOpen, onClose, onSuccess }) {
  const [reason, setReason] = useState("Complex technical issue requiring specialist hardware diagnosis");
  const [priority, setPriority] = useState("High");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleEscalate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await API.post("/escalate", {
        conversation_id: conversationId,
        reason: reason.trim(),
        priority
      });
      setResult(res.data);
      if (onSuccess) onSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to escalate conversation.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X size={18} />
        </button>

        {!result ? (
          <form onSubmit={handleEscalate}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-950/70 border border-rose-800/60 flex items-center justify-center text-rose-400">
                <ShieldAlert size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Escalate to Human Support Specialist</h3>
                <p className="text-xs text-slate-400">Transfer conversation history and remembered device profile</p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-rose-950/50 border border-rose-800 text-rose-200 text-xs">
                {error}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Escalation Reason</label>
              <textarea
                className="form-textarea h-24 resize-none"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Describe why human intervention is required..."
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Priority Level</label>
              <select
                className="form-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority (Urgent)</option>
                <option value="Critical">Critical Priority (Outage / Hardware Failure)</option>
              </select>
            </div>

            <div className="p-3 mb-5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-400 flex items-start gap-2">
              <AlertTriangle size={15} className="text-amber-400 shrink-0 mt-0.5" />
              <span>
                RecallFlow AI will automatically bundle this customer's active memories (device configuration, past troubleshooting attempts, and communication preferences) into the ticket.
              </span>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="glow-btn-secondary px-4 py-2 rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/40"
              >
                {submitting ? "Escalating..." : "Confirm Escalation"}
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full bg-emerald-950/70 border border-emerald-800/60 flex items-center justify-center text-emerald-400 mx-auto mb-4">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Escalated Successfully!</h3>
            <p className="text-sm text-slate-300 mb-4">{result.message}</p>
            <div className="inline-block px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 font-mono text-sm text-sky-400 mb-6">
              Ticket Number: {result.ticket_number}
            </div>
            <div>
              <button
                onClick={onClose}
                className="glow-btn-primary px-6 py-2 rounded-lg text-sm"
              >
                Return to Chat
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
