import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  MessageSquare,
  Ticket,
  Users,
  Brain,
  BookOpen,
  BarChart3,
  ShieldCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  LogOut
} from "lucide-react";

export default function Sidebar({ collapsed, setCollapsed, user, onLogout }) {
  const location = useLocation();
  const isAgent = user?.role === "agent" || user?.role === "admin";

  const navItems = [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { label: "AI Support Chat", path: "/dashboard", icon: MessageSquare, isChatAction: true },
    { label: "Support Tickets", path: "/tickets", icon: Ticket },
    { label: "Memory Bank", path: "/memory", icon: Brain },
    { label: "Knowledge Base", path: "/knowledge", icon: BookOpen },
    { label: "Customer 360", path: "/customers", icon: Users, agentOnly: true },
    { label: "Analytics", path: "/analytics", icon: BarChart3, agentOnly: true },
    { label: "Agent Ops", path: "/agent", icon: ShieldCheck, agentOnly: true },
    { label: "Settings", path: "/settings", icon: Settings },
  ];

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      {/* Brand Header */}
      <div className="sidebar-header">
        <Link to="/dashboard" className="sidebar-brand">
          <div className="brand-icon">
            <Sparkles size={20} className="text-white" />
          </div>
          {!collapsed && (
            <div>
              <div className="flex items-center gap-1.5">
                <span className="brand-title">RecallFlow</span>
                <span className="brand-badge">AI</span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono tracking-tight">Persistent Memory</p>
            </div>
          )}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4 overflow-y-auto">
        {!collapsed && <div className="nav-section-title">Navigation</div>}
        <nav className="space-y-1">
          {navItems.map((item) => {
            if (item.agentOnly && !isAgent) return null;
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== "/dashboard" && location.pathname.startsWith(item.path));

            return (
              <Link
                key={item.label}
                to={item.path}
                className={`nav-link ${isActive ? "active" : ""}`}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={19} className="shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Footer */}
      <div className="p-3 border-t border-slate-800/80">
        <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"} p-2 rounded-lg bg-slate-900/60 border border-slate-800`}>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-slate-200 truncate">{user?.full_name || "User"}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isAgent ? "bg-amber-400" : "bg-emerald-400"}`}></span>
                <p className="text-[10px] text-slate-400 capitalize">{user?.role || "Customer"}</p>
              </div>
            </div>
          )}
          <button
            onClick={onLogout}
            className="text-slate-400 hover:text-rose-400 p-1.5 rounded-md hover:bg-slate-800 transition-colors"
            title="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
