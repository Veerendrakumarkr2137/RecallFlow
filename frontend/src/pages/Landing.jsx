import React from "react";
import { Link } from "react-router-dom";
import {
  Brain,
  Sparkles,
  ShieldCheck,
  Zap,
  MessageSquare,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Users,
  Cpu,
  Layers
} from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 selection:bg-purple-600 selection:text-white">
      {/* Navigation Header */}
      <nav className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-900/40">
            <Sparkles size={22} className="text-white" />
          </div>
          <div>
            <span className="text-xl font-bold font-['Outfit'] tracking-tight">RecallFlow</span>
            <span className="ml-1.5 text-xs font-semibold px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800/60">AI</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="text-sm font-medium text-slate-300 hover:text-white px-4 py-2 transition-colors"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="glow-btn-primary text-sm px-4 py-2 rounded-lg font-medium"
          >
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-16 pb-24 px-6 text-center overflow-hidden">
        {/* Glow ambient background effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-purple-600/15 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute top-1/3 left-1/3 w-[400px] h-[300px] bg-sky-500/15 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-purple-500/30 text-purple-300 text-xs font-medium mb-8 shadow-sm">
            <Brain size={14} className="text-purple-400" />
            <span>Next-Generation AI Support with Continuous Memory</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight font-['Outfit'] mb-6 leading-tight">
            Remember Every Conversation. <br />
            <span className="glow-gradient-text">Resolve Every Problem.</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            Eliminate repetitive support questions forever. RecallFlow AI retains hardware configurations, troubleshooting histories, and customer preferences across every touchpoint.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/dashboard"
              className="glow-btn-primary flex items-center gap-2.5 px-7 py-3.5 rounded-xl text-base font-semibold"
            >
              <span>Explore Interactive Platform</span>
              <ArrowRight size={18} />
            </Link>
            <Link
              to="/login"
              className="glow-btn-secondary px-7 py-3.5 rounded-xl text-base font-medium"
            >
              One-Click Demo Access
            </Link>
          </div>
        </div>

        {/* Live Interactive Memory Preview Simulation */}
        <div className="mt-16 max-w-4xl mx-auto glass-panel p-6 text-left shadow-2xl relative">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80"></span>
              <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
              <span className="text-xs text-slate-400 font-mono ml-2">Customer Session #1042 — Active Memory Snapshot</span>
            </div>
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/40">
              Hindsight Persistent Memory
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
              <p className="text-sky-400 font-semibold mb-1">Remembered Device Profile</p>
              <p className="text-slate-300">Dell Inspiron 15 (7506 2-in-1, Core i7, 16GB RAM)</p>
              <p className="text-slate-400 mt-1">OS: Windows 11 Pro | Battery Wear: 42%</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
              <p className="text-purple-400 font-semibold mb-1">Active Communication Preference</p>
              <p className="text-slate-300">Phone Support (Updated from Email)</p>
              <p className="text-emerald-400 mt-1">Status: Superseded older email preference</p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-20 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold font-['Outfit'] mb-4">
            Architected for Modern Enterprise Support
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Combining structured memory intelligence, verified knowledge retrieval, and automated human escalation into a unified workflow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6">
            <div className="w-12 h-12 rounded-xl bg-purple-950/60 border border-purple-800/40 flex items-center justify-center text-purple-400 mb-5">
              <Brain size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Persistent Memory Intelligence</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Extracts structured facts across customer conversations. Distinguishes outdated preferences, scores relevance, and deduplicates automatically.
            </p>
          </div>

          <div className="glass-card p-6">
            <div className="w-12 h-12 rounded-xl bg-sky-950/60 border border-sky-800/40 flex items-center justify-center text-sky-400 mb-5">
              <BookOpen size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">RAG Company Knowledge Base</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Upload PDFs and Markdown manuals. The AI retrieves verified chunks with citations, clearly distinguishing company policy from personal memories.
            </p>
          </div>

          <div className="glass-card p-6">
            <div className="w-12 h-12 rounded-xl bg-rose-950/60 border border-rose-800/40 flex items-center justify-center text-rose-400 mb-5">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Automated Human Escalation</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Real-time frustration and urgency detection automatically offers human escalation and transfers rich context to support specialists.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-10 px-6 text-center text-xs text-slate-500">
        <p className="mb-2">RecallFlow AI — Enterprise AI-Powered Customer Support Platform</p>
        <p>Built with React, FastAPI, Groq LLM, and Hindsight Memory. Portions adapted from RecallCare AI by Rakesh N Lamani.</p>
      </footer>
    </div>
  );
}
