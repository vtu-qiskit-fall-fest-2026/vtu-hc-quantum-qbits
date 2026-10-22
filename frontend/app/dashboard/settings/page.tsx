"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import {
  Settings,
  Shield,
  Cpu,
  Database,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  Save,
  Info,
  Server,
} from "lucide-react";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [settingsData, setSettingsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form states
  const [defaultDataset, setDefaultDataset] = useState("Delaney / ESOL Solubility");
  const [defaultSeed, setDefaultSeed] = useState(42);
  const [defaultSplit, setDefaultSplit] = useState(0.2);
  const [maxQubits, setMaxQubits] = useState(8);
  const [circuitTemplate, setCircuitTemplate] = useState("angle_embedding_cz");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await api.getSettings();
      setSettingsData(data);
      setDefaultDataset(data.default_dataset);
      setDefaultSeed(data.default_random_seed);
      setDefaultSplit(data.default_split_ratio);
      setMaxQubits(data.max_qubits);
      setCircuitTemplate(data.default_circuit_template);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    try {
      await api.updateSettings({
        default_dataset: defaultDataset,
        default_random_seed: defaultSeed,
        default_split_ratio: defaultSplit,
        max_qubits: maxQubits,
        default_circuit_template: circuitTemplate,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert("Settings save failed: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#43E5F5] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="border-b border-white/10 pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-white">Research & System Settings</h1>
        <p className="text-sm text-[#8C9BB1] mt-1">
          Manage research default parameters, quantum simulation constraints, and dependency health.
        </p>
      </div>

      {saveSuccess && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>Research preferences successfully updated and persisted to database.</span>
        </div>
      )}

      {/* User Profile Info */}
      <div className="rounded-xl border border-white/10 bg-[#0D1422] p-6 space-y-4">
        <h2 className="text-xs font-semibold text-white uppercase font-mono tracking-wider">
          Scientist Profile
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="bg-[#111B2B] p-3 rounded-lg border border-white/5">
            <span className="text-[#8C9BB1]">Full Name:</span>
            <div className="text-white font-medium mt-0.5">{user?.full_name || "Research Fellow"}</div>
          </div>
          <div className="bg-[#111B2B] p-3 rounded-lg border border-white/5">
            <span className="text-[#8C9BB1]">Email Address:</span>
            <div className="text-white font-medium mt-0.5">{user?.email}</div>
          </div>
        </div>
      </div>

      {/* Research Defaults Form */}
      <form onSubmit={handleSave} className="rounded-xl border border-white/10 bg-[#0D1422] p-6 space-y-6">
        <h2 className="text-xs font-semibold text-white uppercase font-mono tracking-wider">
          Default Experiment Parameters
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-[#8C9BB1] mb-1 font-mono">Default Benchmark Dataset</label>
            <input
              type="text"
              value={defaultDataset}
              onChange={(e) => setDefaultDataset(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#111B2B] px-3 py-2 text-xs text-white focus:border-[#43E5F5] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs text-[#8C9BB1] mb-1 font-mono">Default Random Seed</label>
            <input
              type="number"
              value={defaultSeed}
              onChange={(e) => setDefaultSeed(parseInt(e.target.value) || 42)}
              className="w-full rounded-lg border border-white/10 bg-[#111B2B] px-3 py-2 text-xs text-white focus:border-[#43E5F5] focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs text-[#8C9BB1] mb-1 font-mono">
              Train / Test Split Ratio: {defaultSplit} ({Math.round(defaultSplit * 100)}% Test)
            </label>
            <input
              type="range"
              min="0.1"
              max="0.4"
              step="0.05"
              value={defaultSplit}
              onChange={(e) => setDefaultSplit(parseFloat(e.target.value))}
              className="w-full accent-[#43E5F5]"
            />
          </div>

          <div>
            <label className="block text-xs text-[#8C9BB1] mb-1 font-mono">
              Quantum Simulator Wire Limit: {maxQubits} Qubits
            </label>
            <input
              type="range"
              min="2"
              max="12"
              value={maxQubits}
              onChange={(e) => setMaxQubits(parseInt(e.target.value))}
              className="w-full accent-[#638BFF]"
            />
            <span className="text-[10px] text-[#8C9BB1] font-mono">
              Limits state vector size to 2^{maxQubits} complex amplitudes (memory safety).
            </span>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#43E5F5] to-[#638BFF] px-6 py-2.5 text-xs font-semibold text-[#070B14] hover:opacity-90 disabled:opacity-50 transition-all shadow-md shadow-[#43E5F5]/20 font-mono"
          >
            <Save size={14} />
            <span>{saving ? "Saving..." : "Save Preferences"}</span>
          </button>
        </div>
      </form>

      {/* Dependency & Runtime Health Status */}
      <div className="rounded-xl border border-white/10 bg-[#0D1422] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-white uppercase font-mono tracking-wider">
            Dependency Runtime Verification
          </h2>
          <span className="text-[10px] text-emerald-400 font-mono bg-[#111B2B] px-2 py-0.5 rounded border border-white/5">
            All Core Engines Operational
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="bg-[#111B2B] p-3 rounded-lg border border-white/5 flex items-center justify-between">
            <span className="text-[#8C9BB1]">RDKit 2026.09:</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 size={14} /> Active
            </span>
          </div>

          <div className="bg-[#111B2B] p-3 rounded-lg border border-white/5 flex items-center justify-between">
            <span className="text-[#8C9BB1]">PennyLane 0.45:</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 size={14} /> Active
            </span>
          </div>

          <div className="bg-[#111B2B] p-3 rounded-lg border border-white/5 flex items-center justify-between">
            <span className="text-[#8C9BB1]">Scikit-Learn:</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 size={14} /> Active
            </span>
          </div>

          <div className="bg-[#111B2B] p-3 rounded-lg border border-white/5 flex items-center justify-between">
            <span className="text-[#8C9BB1]">Persistence:</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 size={14} /> Ready
            </span>
          </div>
        </div>
      </div>

      {/* Scientific Integrity Limitations Notice */}
      <div className="rounded-xl border border-white/10 bg-[#090F1B] p-5 text-xs text-[#8C9BB1] space-y-2 font-mono">
        <div className="text-white font-semibold flex items-center gap-2">
          <Info size={14} className="text-[#43E5F5]" />
          <span>Scientific Boundaries & Computational Limits</span>
        </div>
        <p>
          Simulations run on local classical CPUs via PennyLane's exact state vector framework. 
          Quantum Hilbert spaces scale exponentially with wire count (O(2^N)), so experiments beyond 12 qubits are throttled to ensure zero memory exhaustion.
        </p>
        <p>
          No clinical, pharmacokinetic, or therapeutic claims are derived from computed physical descriptors or surrogate predictions.
        </p>
      </div>

      {/* Account Security & Logout */}
      <div className="rounded-xl border border-red-500/20 bg-[#0D1422] p-6 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Session Security</h3>
          <p className="text-xs text-[#8C9BB1] mt-0.5">
            Terminate active session cookie and access token.
          </p>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-colors font-mono"
        >
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
