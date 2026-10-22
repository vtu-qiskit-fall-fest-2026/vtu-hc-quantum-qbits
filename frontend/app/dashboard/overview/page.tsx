"use client";

import React, { useEffect, useState } from "react";
import NextLink from "next/link";
import { api } from "@/lib/api";
import {
  Atom,
  Cpu,
  TrendingUp,
  FlaskConical,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Layers,
  History,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function OverviewPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOverview();
  }, []);

  const loadOverview = async () => {
    try {
      setLoading(true);
      const res = await api.getOverview();
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to load overview data.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#43E5F5] border-t-transparent" />
          <span className="text-xs font-mono text-[#8C9BB1]">Fetching user statistics...</span>
        </div>
      </div>
    );
  }

  const stats = data?.stats || {
    molecules_analyzed: 0,
    experiments_completed: 0,
    classical_models_trained: 0,
    quantum_experiments_completed: 0,
  };

  const perfChart = data?.performance_chart || [];
  const recentExps = data?.recent_experiments || [];
  const recentMols = data?.recent_molecules || [];

  return (
    <div className="space-y-8">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Research Workspace</h1>
          <p className="text-sm text-[#8C9BB1] mt-1">
            Hybrid Quantum-Classical computational chemistry overview & metrics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <NextLink
            href="/dashboard/quantum"
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#43E5F5] to-[#638BFF] px-4 py-2 text-xs font-semibold text-[#070B14] hover:opacity-90 transition-all shadow-md shadow-[#43E5F5]/20"
          >
            <Sparkles size={14} />
            <span>New Experiment</span>
          </NextLink>
        </div>
      </div>

      {/* Real Persisted User Statistics (Never Fabricated) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-white/10 bg-[#0D1422] p-5 shadow-sm">
          <div className="flex items-center justify-between text-[#8C9BB1]">
            <span className="text-xs font-mono uppercase tracking-wider">Molecules Saved</span>
            <div className="p-2 rounded-lg bg-cyan-500/10 text-[#43E5F5]">
              <Atom size={18} />
            </div>
          </div>
          <div className="mt-3 text-3xl font-bold text-white font-mono">
            {stats.molecules_analyzed}
          </div>
          <p className="mt-1 text-[11px] text-[#8C9BB1]">Persistent user chemical library</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#0D1422] p-5 shadow-sm">
          <div className="flex items-center justify-between text-[#8C9BB1]">
            <span className="text-xs font-mono uppercase tracking-wider">Completed Experiments</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-[#638BFF]">
              <FlaskConical size={18} />
            </div>
          </div>
          <div className="mt-3 text-3xl font-bold text-white font-mono">
            {stats.experiments_completed}
          </div>
          <p className="mt-1 text-[11px] text-[#8C9BB1]">Total verified research runs</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#0D1422] p-5 shadow-sm">
          <div className="flex items-center justify-between text-[#8C9BB1]">
            <span className="text-xs font-mono uppercase tracking-wider">Classical Models</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="mt-3 text-3xl font-bold text-white font-mono">
            {stats.classical_models_trained}
          </div>
          <p className="mt-1 text-[11px] text-[#8C9BB1]">Random Forest, Ridge & Baselines</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#0D1422] p-5 shadow-sm">
          <div className="flex items-center justify-between text-[#8C9BB1]">
            <span className="text-xs font-mono uppercase tracking-wider">Quantum Runs</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Cpu size={18} />
            </div>
          </div>
          <div className="mt-3 text-3xl font-bold text-white font-mono">
            {stats.quantum_experiments_completed}
          </div>
          <p className="mt-1 text-[11px] text-[#8C9BB1]">PennyLane Quantum Kernel QSVC</p>
        </div>
      </div>

      {/* Quick-Start Research Actions */}
      <div className="rounded-xl border border-white/10 bg-[#0D1422]/60 p-6">
        <h2 className="text-sm font-semibold tracking-wide text-white uppercase font-mono mb-4">
          Research Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NextLink
            href="/dashboard/explorer"
            className="group flex flex-col justify-between p-4 rounded-xl border border-white/10 bg-[#111B2B]/70 hover:border-[#43E5F5]/40 hover:bg-[#111B2B] transition-all"
          >
            <div>
              <div className="flex items-center gap-2 text-[#43E5F5] mb-2 font-medium text-sm">
                <Atom size={16} />
                <span>Molecular Explorer</span>
              </div>
              <p className="text-xs text-[#8C9BB1]">
                Input SMILES strings to calculate RDKit descriptors, view 2D structures, and explore interactive 3D force fields.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs text-[#43E5F5] font-mono group-hover:translate-x-1 transition-transform">
              <span>Launch Explorer</span>
              <ArrowRight size={12} />
            </div>
          </NextLink>

          <NextLink
            href="/dashboard/prediction"
            className="group flex flex-col justify-between p-4 rounded-xl border border-white/10 bg-[#111B2B]/70 hover:border-[#638BFF]/40 hover:bg-[#111B2B] transition-all"
          >
            <div>
              <div className="flex items-center gap-2 text-[#638BFF] mb-2 font-medium text-sm">
                <TrendingUp size={16} />
                <span>Solubility Prediction</span>
              </div>
              <p className="text-xs text-[#8C9BB1]">
                Train Random Forest and linear regression on the Delaney ESOL benchmark with strictly isolated train/test splits.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs text-[#638BFF] font-mono group-hover:translate-x-1 transition-transform">
              <span>Train Regressor</span>
              <ArrowRight size={12} />
            </div>
          </NextLink>

          <NextLink
            href="/dashboard/quantum"
            className="group flex flex-col justify-between p-4 rounded-xl border border-white/10 bg-[#111B2B]/70 hover:border-emerald-500/40 hover:bg-[#111B2B] transition-all"
          >
            <div>
              <div className="flex items-center gap-2 text-emerald-400 mb-2 font-medium text-sm">
                <Cpu size={16} />
                <span>Quantum Kernel Classifier</span>
              </div>
              <p className="text-xs text-[#8C9BB1]">
                Execute real PennyLane quantum state fidelity overlaps on molecular PCA features using local quantum simulator.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs text-emerald-400 font-mono group-hover:translate-x-1 transition-transform">
              <span>Run Quantum Lab</span>
              <ArrowRight size={12} />
            </div>
          </NextLink>
        </div>
      </div>

      {/* Model Performance Chart (Rendered when actual real experiments exist) */}
      <div className="rounded-xl border border-white/10 bg-[#0D1422] p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold tracking-wide text-white uppercase font-mono">
              Empirical Performance Trajectory
            </h2>
            <p className="text-xs text-[#8C9BB1] mt-0.5">
              Score metric (R² for regression / F1 for classification) across completed user experiments.
            </p>
          </div>
          <span className="text-xs font-mono text-[#43E5F5] bg-[#111B2B] px-2.5 py-1 rounded border border-white/5">
            {perfChart.length} Real Data Points
          </span>
        </div>

        {perfChart.length > 0 ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={perfChart} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1B293E" />
                <XAxis dataKey="name" stroke="#8C9BB1" tick={{ fontSize: 11 }} />
                <YAxis stroke="#8C9BB1" tick={{ fontSize: 11 }} domain={[0, 1]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#111B2B",
                    borderColor: "rgba(67, 229, 245, 0.2)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#43E5F5"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#43E5F5" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed border-white/10 text-center p-6">
            <p className="text-sm text-[#8C9BB1]">No performance records yet.</p>
            <p className="text-xs text-[#8C9BB1]/60 mt-1 max-w-md">
              Real metrics will automatically appear here once you run classical regression or quantum classification experiments.
            </p>
            <NextLink
              href="/dashboard/quantum"
              className="mt-4 text-xs text-[#43E5F5] hover:underline font-mono"
            >
              Run First Experiment →
            </NextLink>
          </div>
        )}
      </div>

      {/* Two Column Layout: Recent Experiments & Recent Saved Molecules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Experiments */}
        <div className="rounded-xl border border-white/10 bg-[#0D1422] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold tracking-wide text-white uppercase font-mono">
              Recent Experiments
            </h2>
            <NextLink
              href="/dashboard/history"
              className="text-xs text-[#43E5F5] hover:underline font-mono"
            >
              View All
            </NextLink>
          </div>

          {recentExps.length > 0 ? (
            <div className="divide-y divide-white/5 space-y-3">
              {recentExps.map((exp: any) => (
                <div key={exp.id} className="pt-3 first:pt-0 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-white">{exp.name}</div>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#8C9BB1] font-mono">
                      <span className="capitalize">{exp.type}</span>
                      <span>·</span>
                      <span>{exp.model_family}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-2 py-0.5 text-[10px] rounded font-mono ${
                        exp.status === "completed"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-red-500/10 text-red-400 border border-red-500/20"
                      }`}
                    >
                      {exp.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-[#8C9BB1]">
              No experiments run in this account yet.
            </div>
          )}
        </div>

        {/* Recent Molecules */}
        <div className="rounded-xl border border-white/10 bg-[#0D1422] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold tracking-wide text-white uppercase font-mono">
              Recent Molecule Activity
            </h2>
            <NextLink
              href="/dashboard/saved-molecules"
              className="text-xs text-[#43E5F5] hover:underline font-mono"
            >
              View Library
            </NextLink>
          </div>

          {recentMols.length > 0 ? (
            <div className="divide-y divide-white/5 space-y-3">
              {recentMols.map((mol: any) => (
                <div key={mol.id} className="pt-3 first:pt-0 flex items-center justify-between">
                  <div className="truncate max-w-[70%]">
                    <div className="text-xs font-medium text-white truncate">{mol.name}</div>
                    <div className="text-[11px] font-mono text-[#43E5F5] truncate mt-0.5">
                      {mol.smiles}
                    </div>
                  </div>
                  <div className="text-right text-[11px] font-mono text-[#8C9BB1]">
                    {mol.formula}
                    <div className="text-[10px] text-[#8C9BB1]/60">MW: {mol.mw}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-[#8C9BB1]">
              No saved molecules yet. Explore and save compounds in Molecular Explorer.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
