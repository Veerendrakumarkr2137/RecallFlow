import React from "react";
import { AlertCircle, CheckCircle2, Clock, ShieldAlert, Sparkles, AlertTriangle } from "lucide-react";

export function TicketStatusBadge({ status }) {
  const s = String(status || "Open").toLowerCase();
  if (s === "open") {
    return <span className="badge badge-open"><AlertCircle size={12} /> Open</span>;
  }
  if (s === "in progress" || s === "pending") {
    return <span className="badge badge-in-progress"><Clock size={12} /> {status}</span>;
  }
  if (s === "resolved") {
    return <span className="badge badge-resolved"><CheckCircle2 size={12} /> Resolved</span>;
  }
  if (s === "escalated") {
    return <span className="badge badge-escalated"><ShieldAlert size={12} /> Escalated</span>;
  }
  return <span className="badge badge-open">{status}</span>;
}

export function PriorityBadge({ priority }) {
  const p = String(priority || "Medium").toLowerCase();
  if (p === "critical") {
    return <span className="badge badge-critical"><AlertTriangle size={12} /> Critical</span>;
  }
  if (p === "high") {
    return <span className="badge badge-high">High</span>;
  }
  if (p === "medium") {
    return <span className="badge badge-medium">Medium</span>;
  }
  return <span className="badge badge-low">Low</span>;
}

export function SentimentBadge({ label, score }) {
  const l = String(label || "Neutral").toLowerCase();
  let color = "text-slate-400 bg-slate-800/60 border-slate-700";
  if (l === "positive") color = "text-emerald-400 bg-emerald-950/40 border-emerald-800/50";
  if (l === "negative") color = "text-amber-400 bg-amber-950/40 border-amber-800/50";
  if (l === "frustrated") color = "text-rose-400 bg-rose-950/50 border-rose-800/60 animate-pulse";
  if (l === "urgent") color = "text-red-400 bg-red-950/50 border-red-800/60";

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${color}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
      {label} {score !== undefined && `(${score > 0 ? "+" : ""}${score})`}
    </span>
  );
}

export function MemoryConfidenceBadge({ confidence = 0.95 }) {
  const pct = Math.round(confidence * 100);
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-950/60 text-purple-300 border border-purple-800/40">
      <Sparkles size={11} className="text-purple-400" />
      {pct}% confidence
    </span>
  );
}
