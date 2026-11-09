import React, { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  Smile,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Users,
  ShieldAlert,
  ArrowUpRight
} from "lucide-react";
import API from "../services/api";
import { CardSkeleton } from "../components/LoadingSkeleton";

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    async function loadAnalytics() {
      setLoading(true);
      try {
        const res = await API.get(`/analytics/overview?days=${days}`);
        setData(res.data);
      } catch (err) {
        console.error("Failed to load analytics:", err);
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, [days]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-slate-800 rounded w-1/4 animate-pulse"></div>
        <CardSkeleton count={4} />
      </div>
    );
  }

  const {
    total_customers,
    total_conversations,
    total_tickets,
    open_tickets,
    resolved_tickets,
    escalated_tickets,
    resolution_rate,
    avg_response_time_ms,
    customer_satisfaction_score,
    sentiment_breakdown,
    top_issue_categories,
    daily_activity
  } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 size={20} className="text-purple-400" />
            <h1 className="text-2xl font-bold font-['Outfit'] text-white">Support & Sentiment Analytics</h1>
          </div>
          <p className="text-sm text-slate-400">
            Real-time telemetry measuring AI resolution rates, customer sentiment, and operational responsiveness.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                days === d
                  ? "bg-purple-950 border-purple-500 text-purple-300"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              Last {d} Days
            </button>
          ))}
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Resolution Rate</span>
            <CheckCircle2 size={18} className="text-emerald-400" />
          </div>
          <p className="text-3xl font-extrabold text-white font-['Outfit']">{resolution_rate}%</p>
          <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
            <TrendingUp size={12} /> Tier 1 Autonomous AI deflection
          </p>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Customer CSAT</span>
            <Smile size={18} className="text-amber-400" />
          </div>
          <p className="text-3xl font-extrabold text-white font-['Outfit']">{customer_satisfaction_score} / 5.0</p>
          <p className="text-xs text-slate-400 mt-1">Based on real sentiment signals</p>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg AI Response</span>
            <Clock size={18} className="text-sky-400" />
          </div>
          <p className="text-3xl font-extrabold text-white font-['Outfit']">{avg_response_time_ms} ms</p>
          <p className="text-xs text-slate-400 mt-1">Groq LPUs + Memory index</p>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Escalated Ratio</span>
            <ShieldAlert size={18} className="text-rose-400" />
          </div>
          <p className="text-3xl font-extrabold text-white font-['Outfit']">
            {total_tickets > 0 ? ((escalated_tickets / total_tickets) * 100).toFixed(1) : 0}%
          </p>
          <p className="text-xs text-slate-400 mt-1">{escalated_tickets} escalated to specialists</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sentiment Distribution */}
        <div className="glass-panel p-5 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider font-['Outfit']">
            Customer Sentiment Distribution
          </h2>
          <p className="text-xs text-slate-400">
            Real-time classification based on linguistic cues, frustration keywords, and tone:
          </p>

          <div className="space-y-3 pt-2">
            {Object.entries(sentiment_breakdown || {}).map(([label, count]) => {
              const total = Object.values(sentiment_breakdown).reduce((a, b) => a + b, 0) || 1;
              const pct = Math.round((count / total) * 100);

              let barColor = "bg-slate-600";
              if (label === "Positive") barColor = "bg-emerald-500";
              if (label === "Neutral") barColor = "bg-sky-500";
              if (label === "Negative") barColor = "bg-amber-500";
              if (label === "Frustrated") barColor = "bg-rose-500";
              if (label === "Urgent") barColor = "bg-red-500";

              return (
                <div key={label} className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span className="font-medium">{label}</span>
                    <span className="text-slate-400">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${barColor} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.max(pct, 4)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Recurring Issue Categories */}
        <div className="glass-panel p-5 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider font-['Outfit']">
            Recurring Problem Clusters
          </h2>
          <p className="text-xs text-slate-400">
            Support tickets categorized by hardware component and service domain:
          </p>

          <div className="space-y-3 pt-2">
            {top_issue_categories.map((cat, idx) => {
              const maxCount = Math.max(...top_issue_categories.map((c) => c.count), 1);
              const pct = Math.round((cat.count / maxCount) * 100);

              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span className="font-medium">{cat.category}</span>
                    <span className="text-slate-400">{cat.count} tickets</span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-sky-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(pct, 6)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
