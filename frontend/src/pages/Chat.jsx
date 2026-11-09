import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Send,
  Brain,
  Sparkles,
  ShieldAlert,
  BookOpen,
  ArrowLeft,
  Info,
  Clock,
  RotateCcw
} from "lucide-react";
import API from "../services/api";
import { ChatSkeleton } from "../components/LoadingSkeleton";
import { SentimentBadge, MemoryConfidenceBadge } from "../components/StatusBadge";
import EscalationModal from "../components/EscalationModal";

export default function Chat() {
  const { conversationId } = useParams();
  const navigate = useNavigate();

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  // Side panel memory & knowledge state
  const [activeSessionMemories, setActiveSessionMemories] = useState([]);
  const [activeSources, setActiveSources] = useState([]);
  const [showEscalationModal, setShowEscalationModal] = useState(false);
  const [escalationOffered, setEscalationOffered] = useState(false);

  const messagesEndRef = useRef(null);

  // Load conversation messages
  useEffect(() => {
    let active = true;

    async function loadChat() {
      setLoadingHistory(true);
      setError("");
      try {
        const res = await API.get(`/conversations/${conversationId}/messages`);
        if (!active) return;
        setConversation({
          id: res.data.conversation_id,
          title: res.data.title,
          sentiment_label: res.data.sentiment_label,
          is_escalated: res.data.is_escalated
        });
        setMessages(res.data.messages || []);
      } catch (err) {
        if (!active) return;
        if (err.response?.status === 401) {
          navigate("/login");
        } else {
          setError(err.response?.data?.detail || "Could not load conversation.");
        }
      } finally {
        if (active) setLoadingHistory(false);
      }
    }

    loadChat();
    return () => {
      active = false;
    };
  }, [conversationId, navigate]);

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    const cleanMsg = inputText.trim();
    if (!cleanMsg || sending) return;

    setInputText("");
    setSending(true);
    setError("");

    // Optimistic user message
    const tempId = Date.now();
    const userMsg = {
      id: tempId,
      role: "user",
      content: cleanMsg,
      created_at: new Date().toISOString()
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await API.post("/chat", {
        message: cleanMsg,
        conversation_id: conversationId
      });

      // Update AI message
      const aiMsg = {
        id: tempId + 1,
        role: "assistant",
        content: res.data.reply,
        memories_used: res.data.memories_used,
        knowledge_sources: res.data.knowledge_sources,
        created_at: new Date().toISOString()
      };
      setMessages((prev) => [...prev, aiMsg]);

      // Update side panel telemetry
      if (res.data.memories) {
        setActiveSessionMemories(res.data.memories);
      }
      if (res.data.knowledge_sources) {
        setActiveSources(res.data.knowledge_sources);
      }
      if (res.data.offer_escalation) {
        setEscalationOffered(true);
      }
      if (res.data.sentiment) {
        setConversation((prev) => ({
          ...prev,
          sentiment_label: res.data.sentiment.label
        }));
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to deliver response. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleQuickPrompt = (prompt) => {
    setInputText(prompt);
  };

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col md:flex-row gap-4">
      {/* Main Chat Column */}
      <div className="flex-1 flex flex-col glass-panel overflow-hidden border border-slate-800">
        {/* Chat Header */}
        <div className="p-3.5 px-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              title="Back to Dashboard"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h2 className="text-sm font-bold text-white truncate max-w-xs md:max-w-md">
                {conversation?.title || "Support Session"}
              </h2>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>RecallFlow Autonomous Engine</span>
                {conversation?.sentiment_label && (
                  <SentimentBadge label={conversation.sentiment_label} />
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEscalationModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-950/60 text-rose-300 border border-rose-800/60 hover:bg-rose-900/50 transition-colors shadow-sm"
            >
              <ShieldAlert size={14} />
              <span>Escalate to Human</span>
            </button>
          </div>
        </div>

        {/* Escalation Notification Banner if suggested */}
        {escalationOffered && !conversation?.is_escalated && (
          <div className="bg-gradient-to-r from-rose-950/80 to-amber-950/60 border-b border-rose-800/60 px-4 py-2.5 flex items-center justify-between text-xs text-rose-200">
            <div className="flex items-center gap-2">
              <ShieldAlert size={16} className="text-rose-400 shrink-0" />
              <span>
                RecallFlow detected high issue complexity or troubleshooting loops. Would you like to speak directly with a human specialist?
              </span>
            </div>
            <button
              onClick={() => setShowEscalationModal(true)}
              className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shrink-0 ml-3"
            >
              Escalate Now
            </button>
          </div>
        )}

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loadingHistory ? (
            <ChatSkeleton />
          ) : messages.length === 0 ? (
            <div className="text-center py-16 max-w-md mx-auto">
              <div className="w-12 h-12 rounded-xl bg-purple-950/60 border border-purple-800/40 flex items-center justify-center text-purple-400 mx-auto mb-3">
                <Sparkles size={24} />
              </div>
              <h3 className="text-base font-bold text-white mb-1">RecallFlow AI Support</h3>
              <p className="text-xs text-slate-400 mb-6">
                I remember your previous hardware configurations, reported battery drain, and contact preferences.
              </p>
              <div className="space-y-2 text-left">
                <button
                  onClick={() => handleQuickPrompt("What do you remember about my laptop and previous battery issues?")}
                  className="w-full p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-purple-500/50 text-xs text-slate-300 text-left transition-colors"
                >
                  💡 "What do you remember about my laptop and previous battery issues?"
                </button>
                <button
                  onClick={() => handleQuickPrompt("How do I run hardware diagnostics for Dell Inspiron?")}
                  className="w-full p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-purple-500/50 text-xs text-slate-300 text-left transition-colors"
                >
                  💡 "How do I run hardware diagnostics for Dell Inspiron?"
                </button>
                <button
                  onClick={() => handleQuickPrompt("I prefer phone support going forward. Please update my contact preference.")}
                  className="w-full p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-purple-500/50 text-xs text-slate-300 text-left transition-colors"
                >
                  💡 "I prefer phone support going forward. Please update my contact preference."
                </button>
              </div>
            </div>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`message-bubble ${
                    m.role === "user" ? "message-user" : "message-assistant"
                  }`}
                >
                  {m.role === "assistant" && (
                    <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-slate-800 text-[11px] text-purple-400 font-medium">
                      <Sparkles size={13} />
                      <span>RecallFlow AI Support</span>
                      {m.memories_used > 0 && (
                        <span className="ml-auto text-[10px] text-sky-400 bg-sky-950/80 px-1.5 py-0.5 rounded border border-sky-800/40">
                          {m.memories_used} Memories Recalled
                        </span>
                      )}
                    </div>
                  )}

                  <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {m.content}
                    </ReactMarkdown>
                  </div>

                  {m.knowledge_sources && m.knowledge_sources.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex flex-wrap gap-2">
                      <span className="font-semibold text-slate-300 flex items-center gap-1">
                        <BookOpen size={12} /> Sources:
                      </span>
                      {m.knowledge_sources.map((s, idx) => (
                        <span key={idx} className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-sky-300">
                          {s.document_title} (§Chunk {s.chunk_index})
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 mt-1 px-1">
                  {m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                </span>
              </div>
            ))
          )}

          {sending && (
            <div className="flex items-center gap-3 text-xs text-purple-400 p-2">
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping"></span>
              <span>RecallFlow AI is retrieving memory & formulating solution...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="p-3 bg-slate-900/90 border-t border-slate-800">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask anything or state updated preferences (e.g., 'My battery drains in 30 mins')..."
              className="form-input flex-1 py-2.5 text-sm"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!inputText.trim() || sending}
              className="glow-btn-primary px-5 rounded-lg flex items-center justify-center shrink-0"
            >
              <Send size={16} />
            </button>
          </div>
        </form>
      </div>

      {/* Side Intelligence Panel (Persistent Memory & Verified Knowledge) */}
      <div className="w-full md:w-80 glass-panel p-4 flex flex-col gap-4 overflow-y-auto hidden lg:flex">
        <div>
          <div className="flex items-center gap-2 text-sm font-bold text-white mb-2 font-['Outfit']">
            <Brain size={17} className="text-purple-400" />
            <span>Active Memory Insights</span>
          </div>
          <p className="text-xs text-slate-400 mb-3 leading-relaxed">
            Customer memories identified and injected into this session:
          </p>

          <div className="space-y-2">
            {activeSessionMemories.length > 0 ? (
              activeSessionMemories.map((mem, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs">
                  <div className="flex items-center justify-between text-[10px] text-purple-400 font-semibold mb-1">
                    <span>{mem.category}</span>
                    <MemoryConfidenceBadge confidence={mem.confidence} />
                  </div>
                  <p className="text-slate-300 leading-snug">{mem.content}</p>
                </div>
              ))
            ) : (
              <div className="p-3 text-center border border-dashed border-slate-800 rounded-lg text-xs text-slate-500">
                Send a message to view the persistent memory context retrieved for this session.
              </div>
            )}
          </div>
        </div>

        {/* Verified Knowledge Base Chunks */}
        <div className="pt-3 border-t border-slate-800">
          <div className="flex items-center gap-2 text-sm font-bold text-white mb-2 font-['Outfit']">
            <BookOpen size={17} className="text-sky-400" />
            <span>Grounding Documents</span>
          </div>
          <div className="space-y-2">
            {activeSources.length > 0 ? (
              activeSources.map((src, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs">
                  <p className="text-sky-400 font-semibold text-[11px]">{src.document_title}</p>
                  <p className="text-slate-400 text-[10px]">Indexed Section {src.chunk_index} verified by RAG</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500">Official support documentation will be cited here when referenced.</p>
            )}
          </div>
        </div>
      </div>

      {/* Human Escalation Modal */}
      <EscalationModal
        conversationId={conversationId}
        isOpen={showEscalationModal}
        onClose={() => setShowEscalationModal(false)}
        onSuccess={(data) => {
          setConversation((prev) => ({ ...prev, is_escalated: true }));
        }}
      />
    </div>
  );
}
