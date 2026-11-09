import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight, UserCheck, ShieldCheck, Lock, Mail } from "lucide-react";
import API from "../services/api";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await API.post("/login", {
        email: form.email.trim(),
        password: form.password
      });

      localStorage.setItem("token", response.data.access_token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      if (response.data.role === "agent" || response.data.role === "admin") {
        navigate("/agent");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid login credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (email, password) => {
    setForm({ email, password });
  };

  return (
    <div className="auth-page">
      <div className="auth-card-wrapper">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-900/40 mx-auto mb-3">
            <Sparkles size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold font-['Outfit'] text-white">Welcome to RecallFlow</h1>
          <p className="text-xs text-slate-400 mt-1">Remember Every Conversation. Resolve Every Problem.</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-950/50 border border-rose-800 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label className="form-label">Email Address</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                name="email"
                type="email"
                placeholder="name@company.com"
                value={form.email}
                onChange={handleChange}
                className="form-input pl-9"
                required
              />
            </div>
          </div>

          <div>
            <label className="form-label">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                name="password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                className="form-input pl-9"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="glow-btn-primary w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 mt-2"
          >
            <span>{loading ? "Signing in..." : "Sign In to RecallFlow"}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Quick Demo Credentials Switcher */}
        <div className="mt-6 pt-5 border-t border-slate-800">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5 text-center">
            One-Click Demo Credentials
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillDemo("alex.mercer@example.com", "CustomerPass123!")}
              className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-sky-500/50 text-left transition-colors"
            >
              <div className="flex items-center gap-1.5 text-sky-400 font-medium text-xs mb-0.5">
                <UserCheck size={13} />
                <span>Customer</span>
              </div>
              <p className="text-[10px] text-slate-400 truncate">Alex Mercer</p>
            </button>

            <button
              type="button"
              onClick={() => fillDemo("agent@recallflow.ai", "AgentPass123!")}
              className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-purple-500/50 text-left transition-colors"
            >
              <div className="flex items-center gap-1.5 text-purple-400 font-medium text-xs mb-0.5">
                <ShieldCheck size={13} />
                <span>Support Agent</span>
              </div>
              <p className="text-[10px] text-slate-400 truncate">Sarah Connor</p>
            </button>
          </div>
        </div>

        <p className="text-xs text-center text-slate-400 mt-6">
          Don't have an account?{" "}
          <Link to="/register" className="text-purple-400 hover:text-purple-300 font-medium">
            Register now
          </Link>
        </p>
      </div>
    </div>
  );
}
