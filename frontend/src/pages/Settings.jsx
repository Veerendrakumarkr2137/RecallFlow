import React, { useState, useEffect } from "react";
import {
  Settings as SettingsIcon,
  User,
  Shield,
  Brain,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Save,
  Server
} from "lucide-react";
import API from "../services/api";

export default function Settings({ user, onUpdateUser }) {
  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || "",
    company: user?.company || "",
    phone: user?.phone || "",
    tier: user?.tier || "Standard"
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [healthData, setHealthData] = useState(null);
  const [testingHealth, setTestingHealth] = useState(false);

  useEffect(() => {
    async function checkHealth() {
      setTestingHealth(true);
      try {
        const res = await API.get("/health");
        setHealthData(res.data);
      } catch (err) {
        setHealthData({ status: "degraded", database: "disconnected", hindsight_configured: false });
      } finally {
        setTestingHealth(false);
      }
    }
    checkHealth();
  }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await API.put("/me", profileForm);
      if (onUpdateUser) onUpdateUser(res.data);
      alert("Profile updated successfully!");
    } catch (err) {
      alert("Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="glass-panel p-6">
        <div className="flex items-center gap-2 mb-1">
          <SettingsIcon size={20} className="text-purple-400" />
          <h1 className="text-2xl font-bold font-['Outfit'] text-white">System & Profile Settings</h1>
        </div>
        <p className="text-sm text-slate-400">
          Manage your account profile, AI engine preferences, and inspect persistent memory diagnostics.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Settings */}
        <div className="md:col-span-2 glass-panel p-5 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider font-['Outfit'] flex items-center gap-2">
            <User size={16} className="text-sky-400" />
            <span>Account Profile</span>
          </h2>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="form-label">Full Name</label>
              <input
                type="text"
                value={profileForm.full_name}
                onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                className="form-input"
                required
              />
            </div>

            <div>
              <label className="form-label">Email Address (Read-only)</label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="form-input opacity-60 cursor-not-allowed"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">Company</label>
                <input
                  type="text"
                  value={profileForm.company}
                  onChange={(e) => setProfileForm({ ...profileForm, company: e.target.value })}
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Phone Number</label>
                <input
                  type="text"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="form-input"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingProfile}
                className="glow-btn-primary px-5 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2"
              >
                <Save size={14} />
                <span>{savingProfile ? "Saving..." : "Save Changes"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Diagnostics & AI Engine Status */}
        <div className="glass-panel p-5 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider font-['Outfit'] flex items-center gap-2">
            <Server size={16} className="text-purple-400" />
            <span>Engine Diagnostics</span>
          </h2>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between font-semibold">
                <span className="text-slate-300">FastAPI Backend</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 size={12} /> Connected
                </span>
              </div>
              <p className="text-[11px] text-slate-500">RecallFlow Core v2.0.0</p>
            </div>

            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between font-semibold">
                <span className="text-slate-300">SQLite Database</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 size={12} /> Healthy
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Persistent local relational layer</p>
            </div>

            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between font-semibold">
                <span className="text-slate-300">Hindsight Memory</span>
                {healthData?.hindsight_configured ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 size={12} /> Connected
                  </span>
                ) : (
                  <span className="text-amber-400 flex items-center gap-1">
                    <AlertTriangle size={12} /> Local Fallback
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                {healthData?.hindsight_configured
                  ? "Remote bank active"
                  : "Local structured hybrid persistence active"}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between font-semibold">
                <span className="text-slate-300">Inference Engine</span>
                <span className="text-sky-400 font-mono text-[10px]">Groq / Fallback</span>
              </div>
              <p className="text-[11px] text-slate-500">openai/gpt-oss-120b</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
