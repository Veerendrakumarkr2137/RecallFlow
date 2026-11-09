import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  MessageSquare,
  Ticket,
  Brain,
  Sparkles,
  Plus,
  ArrowRight,
  Clock,
  Shield,
  Laptop,
  CheckCircle2
} from "lucide-react";
import API from "../services/api";
import { CardSkeleton } from "../components/LoadingSkeleton";
import { TicketStatusBadge, SentimentBadge } from "../components/StatusBadge";

export default function Dashboard({ user }) {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [memoryInsights, setMemoryInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creatingConv, setCreatingConv] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function fetchDashboardData() {
      setLoading(true);
      try {
        const [convRes, ticketRes, memRes] = await Promise.allSettled([
          API.get("/conversations"),
          API.get("/tickets"),
          API.get("/memory/insights")
        ]);

        if (!active) return;

        if (convRes.status === "fulfilled") {
          setConversations(convRes.value.data.conversations || []);
        }
        if (ticketRes.status === "fulfilled") {
          setTickets(ticketRes.value.data.tickets || []);
        }
        if (memRes.status === "fulfilled") {
          setMemoryInsights(memRes.value.data);
        }
      } catch (err) {
        if (active) setError("Could not load dashboard data.");
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchDashboardData();
    return () => {
      active = false;
    };
  }, []);

  const handleStartConversation = async () => {
    if (creatingConv) return;
    setCreatingConv(true);
    try {
      const res = await API.post("/conversations", { title: "New conversation" });
      navigate(`/chat/${res.data.id}`);
    } catch (err) {
      alert("Failed to start conversation.");
    } finally {
      setCreatingConv(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-slate-800 rounded w-1/4 animate-pulse"></div>
        <CardSkeleton count={4} />
      </div>
    );
  }

  const activeMemories = memoryInsights?.memories || [];
  const openTickets = tickets.filter((t) => t.status !== "Resolved");

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="glass-panel p-6 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-950/60 border border-purple-800/40 text-purple-300 text-xs font-medium mb-2">
            <Sparkles size={12} className="text-purple-400" />
            <span>Persistent Memory Architecture v2.0 Active</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold font-['Outfit'] text-white">
            Welcome back, {user?.full_name || "Valued Customer"}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            RecallFlow AI currently preserves {activeMemories.length} structured memory facts across your support interactions.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={handleStartConversation}
            disabled={creatingConv}
            className="glow-btn-primary flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
          >
            <Plus size={16} />
            <span>{creatingConv ? "Creating..." : "Start AI Chat"}</span>
          </button>
          <Link
            to="/tickets"
            className="glow-btn-secondary px-4 py-2.5 rounded-xl text-sm font-medium"
          >
            View Tickets
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Conversations</span>
            <MessageSquare size={17} className="text-sky-400" />
          </div>
          <p className="text-2xl font-bold text-white font-['Outfit']">{conversations.length}</p>
          <p className="text-xs text-slate-400 mt-1">Cross-session remembered chats</p>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Open Tickets</span>
            <Ticket size={17} className="text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-white font-['Outfit']">{openTickets.length}</p>
          <p className="text-xs text-slate-400 mt-1">Pending resolution</p>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Remembered Facts</span>
            <Brain size={17} className="text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-white font-['Outfit']">{activeMemories.length}</p>
          <p className="text-xs text-emerald-400 mt-1">100% Customer Isolated Bank</p>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Support Tier</span>
            <Shield size={17} className="text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-white font-['Outfit']">{user?.tier || "Standard"}</p>
          <p className="text-xs text-slate-400 mt-1">Priority AI & Human Escalation</p>
        </div>
      </div>

      {/* Main Grid: Recent Conversations & Memory Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Conversations */}
        <div className="lg:col-span-2 glass-panel p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MessageSquare size={18} className="text-sky-400" />
              <h2 className="text-lg font-bold text-white font-['Outfit']">Recent Support Conversations</h2>
            </div>
            <button
              onClick={handleStartConversation}
              className="text-xs text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1"
            >
              <span>New</span>
              <Plus size={14} />
            </button>
          </div>

          {conversations.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl">
              <MessageSquare size={36} className="text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-300">No support conversations yet</p>
              <p className="text-xs text-slate-500 mt-1 mb-4">Start your first conversation with RecallFlow AI.</p>
              <button
                onClick={handleStartConversation}
                className="glow-btn-primary px-4 py-2 rounded-lg text-xs"
              >
                Start Conversation
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {conversations.slice(0, 5).map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => navigate(`/chat/${conv.id}`)}
                  className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-purple-500/40 hover:bg-slate-900 transition-all cursor-pointer flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-slate-200 truncate">{conv.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {conv.updated_at ? new Date(conv.updated_at).toLocaleDateString() : "Just now"}
                      </span>
                      {conv.sentiment_label && (
                        <SentimentBadge label={conv.sentiment_label} score={conv.sentiment_score} />
                      )}
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-slate-500 shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Categorized Memory Snapshot */}
        <div className="glass-panel p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Brain size={18} className="text-purple-400" />
              <h2 className="text-lg font-bold text-white font-['Outfit']">Active Memory Bank</h2>
            </div>
            <Link to="/memory" className="text-xs text-purple-400 hover:text-purple-300 font-medium">
              Manage All
            </Link>
          </div>

          <p className="text-xs text-slate-400 mb-3">
            RecallFlow AI uses these facts to personalize your solutions without asking repetitive questions:
          </p>

          <div className="space-y-2.5">
            {activeMemories.slice(0, 4).map((m) => (
              <div key={m.id} className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
                <div className="flex items-center justify-between text-[10px] text-purple-400 font-semibold mb-1">
                  <span>{m.category}</span>
                  <span>{Math.round(m.confidence * 100)}% conf</span>
                </div>
                <p className="text-slate-300 leading-relaxed">{m.content}</p>
              </div>
            ))}

            {activeMemories.length === 0 && (
              <div className="p-4 text-center border border-dashed border-slate-800 rounded-lg text-xs text-slate-500">
                No memories recorded yet. Start chatting and RecallFlow AI will remember your device details and preferences.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
