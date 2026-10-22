"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  GitCompare,
  Cpu,
  TrendingUp,
  Sparkles,
  Info,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

export default function ModelComparisonPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadComparison();
  }, []);

  const loadComparison = async () => {
    try {
      setLoading(true);
      const res = await api.compareExperiments();
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to load model comparison.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#43E5F5] border-t-transparent" />
          <span className="text-xs font-mono text-[#8C9BB1]">Aggregating model benchmarks...</span>
        </div>
      </div>
    );
  }

  const experiments = data?.experiments || [];
  const interpretation = data?.interpretation || "";
  const scientificSummary = data?.scientific_summary || "";

  // Prepare chart data
  const chartData = experiments.map((exp: any) => {
    const m = exp.metrics || {};
    return {
      name: exp.name.length > 20 ? exp.name.substring(0, 20) + "..." : exp.name,
      fullName: exp.name,
      type: exp.experiment_type,
      score: m.f1 !== undefined ? m.f1 : m.r2 !== undefined ? m.r2 : m.accuracy || 0,
      accuracy: m.accuracy || null,
      runtime: exp.training_time_seconds,
    };
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-white/10 pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-white">Model Comparison</h1>
        <p className="text-sm text-[#8C9BB1] mt-1">
          Side-by-side empirical evaluation of classical regressors and quantum kernel classifiers.
        </p>
      </div>

      {experiments.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-[#0D1422] p-8 text-center">
          <GitCompare size={36} className="text-[#8C9BB1] mb-3" />
          <h3 className="text-base font-medium text-white">No Experiments to Compare</h3>
          <p className="text-xs text-[#8C9BB1] mt-1 max-w-md">
            Execute classical solubility regression and quantum classification runs to populate this comparative matrix with authentic metrics.
          </p>
        </div>
      ) : (
        <>
          {/* Dynamic Scientific Interpretation Banner */}
          <div className="rounded-xl border border-[#43E5F5]/30 bg-[#0D1422] p-6 glow-cyan-border">
            <div className="flex items-start gap-3">
              <Sparkles size={20} className="text-[#43E5F5] shrink-0 mt-0.5" />
              <div className="space-y-2">
                <h2 className="text-xs font-semibold text-white uppercase font-mono tracking-wider">
                  Automated Scientific Interpretation
                </h2>
                <p className="text-sm text-[#F2F6FC] leading-relaxed">
                  {interpretation}
                </p>
                <p className="text-xs text-[#8C9BB1] font-mono leading-relaxed pt-1">
                  {scientificSummary}
                </p>
              </div>
            </div>
          </div>

          {/* Performance Comparative Bar Chart */}
          <div className="rounded-xl border border-white/10 bg-[#0D1422] p-6">
            <h3 className="text-xs font-semibold text-white uppercase font-mono mb-4">
              Model Score & Runtime Trade-Off
            </h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1B293E" />
                  <XAxis dataKey="name" stroke="#8C9BB1" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#8C9BB1" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#111B2B",
                      borderColor: "rgba(67, 229, 245, 0.2)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="score" fill="#43E5F5" name="Primary Metric (F1 or R²)" />
                  <Bar dataKey="runtime" fill="#638BFF" name="Runtime (seconds)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detailed Side-by-Side Metrics Table */}
          <div className="rounded-xl border border-white/10 bg-[#0D1422] overflow-hidden">
            <div className="p-4 border-b border-white/10 bg-[#111B2B]">
              <h3 className="text-xs font-semibold text-white uppercase font-mono">
                Comparative Specifications Matrix
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#090F1B] text-[#8C9BB1] border-b border-white/5">
                  <tr>
                    <th className="p-3.5">Experiment</th>
                    <th className="p-3.5">Type</th>
                    <th className="p-3.5">Architecture</th>
                    <th className="p-3.5">Task</th>
                    <th className="p-3.5">Key Performance</th>
                    <th className="p-3.5">Runtime</th>
                    <th className="p-3.5">Executed Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {experiments.map((exp: any) => {
                    const m = exp.metrics || {};
                    return (
                      <tr key={exp.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-3.5 font-medium text-white max-w-xs truncate">
                          {exp.name}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] ${
                              exp.experiment_type === "quantum"
                                ? "bg-cyan-500/10 text-[#43E5F5] border border-cyan-500/20"
                                : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                            }`}
                          >
                            {exp.experiment_type}
                          </span>
                        </td>
                        <td className="p-3.5 text-[#8C9BB1]">{exp.model_family}</td>
                        <td className="p-3.5 capitalize text-[#8C9BB1]">{exp.task_type}</td>
                        <td className="p-3.5 font-bold text-[#43E5F5]">
                          {exp.task_type === "classification" ? (
                            <span>
                              Acc: {m.accuracy !== undefined ? (m.accuracy * 100).toFixed(1) + "%" : "N/A"} · F1: {m.f1?.toFixed(3) || "N/A"}
                            </span>
                          ) : (
                            <span>
                              R²: {m.r2?.toFixed(3) || "N/A"} · MAE: {m.mae?.toFixed(3) || "N/A"}
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-emerald-400">{exp.training_time_seconds}s</td>
                        <td className="p-3.5 text-[#8C9BB1]">
                          {new Date(exp.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
