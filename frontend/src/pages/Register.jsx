import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight, User, Mail, Lock, Building, Phone } from "lucide-react";
import API from "../services/api";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "customer",
    company: "",
    phone: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await API.post("/register", {
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        company: form.company.trim() || undefined,
        phone: form.phone.trim() || undefined
      });

      navigate("/login?registered=true");
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed. Please check inputs and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card-wrapper max-w-lg">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-900/40 mx-auto mb-3">
            <Sparkles size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold font-['Outfit'] text-white">Create RecallFlow Account</h1>
          <p className="text-xs text-slate-400 mt-1">Join the next-generation memory-driven support ecosystem</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-950/50 border border-rose-800 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
          {/* Account Role Selector */}
          <div>
            <label className="form-label">Account Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, role: "customer" })}
                className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                  form.role === "customer"
                    ? "bg-purple-950/60 border-purple-500 text-purple-300"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                Customer / End-User
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, role: "agent" })}
                className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                  form.role === "agent"
                    ? "bg-purple-950/60 border-purple-500 text-purple-300"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                Support Specialist / Agent
              </button>
            </div>
          </div>

          <div>
            <label className="form-label">Full Name</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                name="full_name"
                type="text"
                placeholder="Alex Mercer"
                value={form.full_name}
                onChange={handleChange}
                className="form-input pl-9"
                required
                minLength={2}
              />
            </div>
          </div>

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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="form-label">Company (Optional)</label>
              <div className="relative">
                <Building size={16} className="absolute left-3 top-3 text-slate-400" />
                <input
                  name="company"
                  type="text"
                  placeholder="Acme Inc."
                  value={form.company}
                  onChange={handleChange}
                  className="form-input pl-9"
                />
              </div>
            </div>

            <div>
              <label className="form-label">Phone (Optional)</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-3 text-slate-400" />
                <input
                  name="phone"
                  type="text"
                  placeholder="+1 (555) 000-0000"
                  value={form.phone}
                  onChange={handleChange}
                  className="form-input pl-9"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="form-label">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                name="password"
                type="password"
                placeholder="At least 6 characters"
                value={form.password}
                onChange={handleChange}
                className="form-input pl-9"
                required
                minLength={6}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="glow-btn-primary w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 mt-4"
          >
            <span>{loading ? "Creating Account..." : "Create RecallFlow Account"}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        <p className="text-xs text-center text-slate-400 mt-5">
          Already have an account?{" "}
          <Link to="/login" className="text-purple-400 hover:text-purple-300 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
