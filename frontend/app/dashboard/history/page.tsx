"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  History,
  Trash2,
  ExternalLink,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Cpu,
  TrendingUp,
  FileDown,
  X,
} from "lucide-react";

export default function ExperimentHistoryPage() {
  const [experiments, setExperiments] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<string>("");
  const [filterTask, setFilterTask] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [selectedExp, setSelectedExp] = useState<any>(null);

  useEffect(() => {
    loadExperiments();
  }, [filterType, filterTask]);

  const loadExperiments = async () => {
    try {
      setLoading(true);
      const data = await api.listExperiments(filterType || undefined, filterTask || undefined);
      setExperiments(data);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this experiment record?")) return;
    try {
      await api.deleteExperiment(id);
      setExperiments(experiments.filter((e) => e.id !== id));
      if (selectedExp?.id === id) setSelectedExp(null);
    } catch (err: any) {
      alert("Delete failed: " + err.message);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Experiment History</h1>
          <p className="text-sm text-[#8C9BB1] mt-1">
            Persisted execution logs, hyperparameters, accuracy metrics, and quantum circuit representations.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-[#0D1422] p-4 rounded-xl border border-white/10">
        <div className="flex items-center gap-2 text-xs text-[#8C9BB1] font-mono">
          <Filter size={14} />
          <span>Filters:</span>
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="rounded-lg border border-white/10 bg-[#111B2B] px-3 py-1.5 text-xs text-white focus:outline-none"
        >
          <option value="">All Engine Types</option>
          <option value="classical">Classical ML</option>
          <option value="quantum">Quantum ML</option>
        </select>

        <select
          value={filterTask}
          onChange={(e) => setFilterTask(e.target.value)}
          className="rounded-lg border border-white/10 bg-[#111B2B] px-3 py-1.5 text-xs text-white focus:outline-none"
        >
          <option value="">All Task Types</option>
          <option value="regression">Regression (Solubility)</option>
          <option value="classification">Classification (Activity)</option>
        </select>

        <span className="text-xs text-[#8C9BB1] ml-auto font-mono">
          {experiments.length} Records Persisted
        </span>
      </div>

      {/* Experiment List */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#43E5F5] border-t-transparent" />
        </div>
      ) : experiments.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-[#0D1422] p-8 text-center text-xs text-[#8C9BB1]">
          No experiments match the filter criteria.
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 bg-[#0D1422] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#090F1B] text-[#8C9BB1] border-b border-white/5">
                <tr>
                  <th className="p-3.5">Experiment Name</th>
                  <th className="p-3.5">Engine</th>
                  <th className="p-3.5">Model Family</th>
                  <th className="p-3.5">Dataset</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Key Metric</th>
                  <th className="p-3.5">Duration</th>
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {experiments.map((exp) => {
                  const m = exp.metrics || {};
                  return (
                    <tr key={exp.id} className="hover:bg-white/[0.02]">
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
                      <td className="p-3.5 text-[#8C9BB1] max-w-xs truncate">{exp.dataset_name}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] ${
                            exp.status === "completed"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-red-500/10 text-red-400"
                          }`}
                        >
                          {exp.status}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-white">
                        {exp.task_type === "classification"
                          ? `Acc: ${m.accuracy !== undefined ? (m.accuracy * 100).toFixed(1) + "%" : "N/A"}`
                          : `R²: ${m.r2?.toFixed(3) || "N/A"}`}
                      </td>
                      <td className="p-3.5 text-[#8C9BB1]">{exp.training_time_seconds}s</td>
                      <td className="p-3.5 text-[#8C9BB1]">
                        {new Date(exp.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        <button
                          onClick={() => setSelectedExp(exp)}
                          title="View Details"
                          className="p-1 rounded text-[#8C9BB1] hover:text-[#43E5F5]"
                        >
                          <ExternalLink size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(exp.id)}
                          title="Delete Record"
                          className="p-1 rounded text-[#8C9BB1] hover:text-red-400"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedExp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#0D1422] p-6 shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">{selectedExp.name}</h3>
                <span className="text-[11px] text-[#43E5F5]">
                  ID: {selectedExp.id}
                </span>
              </div>
              <button
                onClick={() => setSelectedExp(null)}
                className="p-1 text-[#8C9BB1] hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[#8C9BB1]">
              <div className="bg-[#111B2B] p-3 rounded-lg border border-white/5">
                <span className="text-[10px] uppercase text-[#43E5F5]">Engine</span>
                <div className="text-sm font-bold text-white mt-0.5">{selectedExp.experiment_type}</div>
              </div>
              <div className="bg-[#111B2B] p-3 rounded-lg border border-white/5">
                <span className="text-[10px] uppercase text-[#43E5F5]">Model Architecture</span>
                <div className="text-sm font-bold text-white mt-0.5">{selectedExp.model_family}</div>
              </div>
            </div>

            {/* Metrics Breakdown */}
            <div className="bg-[#111B2B] p-4 rounded-lg border border-white/5 space-y-2">
              <span className="text-[10px] uppercase text-[#43E5F5] font-bold">Metrics Breakdown</span>
              <pre className="text-xs text-[#F2F6FC] overflow-x-auto">
                {JSON.stringify(selectedExp.metrics, null, 2)}
              </pre>
            </div>

            {/* Circuit Diagram if Quantum */}
            {selectedExp.circuit_diagram && (
              <div className="bg-[#070B14] p-4 rounded-lg border border-white/5 space-y-2">
                <span className="text-[10px] uppercase text-[#43E5F5] font-bold">Circuit QASM / Diagram</span>
                <pre className="text-[11px] text-[#43E5F5] overflow-x-auto">
                  {selectedExp.circuit_diagram}
                </pre>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedExp(null)}
                className="px-4 py-2 rounded-lg bg-[#111B2B] text-white hover:bg-white/10"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
