import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, MessageSquare, Shield, User, Menu, Bell, Sparkles } from "lucide-react";
import API from "../services/api";

export default function Navbar({ user, onToggleMobileMenu }) {
  const navigate = useNavigate();
  const [creating, setCreating] = React.useState(false);

  const startNewConversation = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const res = await API.post("/conversations", { title: "New conversation" });
      navigate(`/chat/${res.data.id}`);
    } catch (err) {
      console.error("Failed to start new conversation:", err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <header className="top-navbar">
      <div className="flex items-center gap-3">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800"
          >
            <Menu size={20} />
          </button>
        )}
        <div className="hidden sm:flex items-center gap-2 text-xs font-mono px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Engine: RecallFlow v2.0 (Active)</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={startNewConversation}
          disabled={creating}
          className="glow-btn-primary flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium"
        >
          <Plus size={15} />
          <span>{creating ? "Opening..." : "New Chat"}</span>
        </button>

        <div className="h-6 w-px bg-slate-800"></div>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-sky-500 flex items-center justify-center font-bold text-xs text-white shadow-sm">
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : "U"}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-slate-200 leading-tight">{user?.full_name || "User"}</p>
            <p className="text-[10px] text-purple-400 capitalize">{user?.role || "Customer"}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
