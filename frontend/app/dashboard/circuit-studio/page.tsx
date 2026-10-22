"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  Binary,
  Layers,
  Sparkles,
  Info,
  Play,
  RotateCcw,
  CheckCircle2,
  Cpu,
} from "lucide-react";

export default function QuantumCircuitStudioPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState("angle_embedding_cz");
  const [qubits, setQubits] = useState(4);
  const [depth, setDepth] = useState(2);
  const [circuitData, setCircuitData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [simOutput, setSimOutput] = useState<any>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    inspectCircuit(qubits, depth, selectedTemplate);
  }, [qubits, depth, selectedTemplate]);

  const loadTemplates = async () => {
    try {
      const t = await api.getCircuitTemplates();
      setTemplates(t);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  const inspectCircuit = async (q: number, d: number, enc: string) => {
    try {
      const data = await api.inspectCircuit(q, d, enc);
      setCircuitData(data);
    } catch {
      // fallback
    }
  };

  const handleSimulateSmall = async () => {
    setSimulating(true);
    setSimOutput(null);
    try {
      const res = await api.runQuantumExperiment({
        name: `Studio Test (${qubits}Q, ${selectedTemplate})`,
        qubit_count: qubits,
        circuit_depth: depth,
        encoding_strategy: selectedTemplate,
        sample_size: 16,
        random_seed: 42,
      });
      setSimOutput(res);
    } catch (e: any) {
      alert("Simulation error: " + e.message);
    } finally {
      setSimulating(false);
    }
  };

  const currentTpl = templates.find((t) => t.id === selectedTemplate) || {
    name: "Angle Embedding with CZ",
    description: "Encodes features into single-qubit rotations with linear entangling CZ gates.",
    entanglement: "Linear Controlled-Z",
    recommended_for: "Continuous descriptors",
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-white/10 pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-white">Quantum Circuit Studio</h1>
        <p className="text-sm text-[#8C9BB1] mt-1">
          Parametric quantum feature map architectures, gate sequences, and live simulator state vector verification.
        </p>
      </div>

      {/* Template Chooser & Architecture Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Templates Selection */}
        <div className="lg:col-span-1 rounded-xl border border-white/10 bg-[#0D1422] p-5 space-y-3">
          <h2 className="text-xs font-semibold text-white uppercase font-mono tracking-wider">
            Supported Circuit Templates
          </h2>
          <div className="space-y-2">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTemplate(t.id)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                  selectedTemplate === t.id
                    ? "border-[#43E5F5] bg-[#111B2B] shadow-md shadow-[#43E5F5]/10"
                    : "border-white/5 bg-[#111B2B]/40 hover:bg-[#111B2B] hover:border-white/10"
                }`}
              >
                <div className="text-xs font-bold text-white font-mono">{t.name}</div>
                <div className="text-[11px] text-[#8C9BB1] mt-1 line-clamp-2">{t.description}</div>
                <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-[#43E5F5]">
                  <span>Entanglement: {t.entanglement}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Live Circuit Customizer */}
        <div className="lg:col-span-2 rounded-xl border border-white/10 bg-[#0D1422] p-6 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white font-mono">
                  {currentTpl.name}
                </h3>
                <p className="text-xs text-[#8C9BB1] mt-0.5">{currentTpl.description}</p>
              </div>
              <span className="text-[10px] font-mono text-[#43E5F5] bg-[#111B2B] px-3 py-1 rounded border border-[#43E5F5]/20">
                Recommended: {currentTpl.recommended_for}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-[#8C9BB1] mb-1.5">
                  Qubits (Quantum Register Size): {qubits}
                </label>
                <input
                  type="range"
                  min="2"
                  max="6"
                  value={qubits}
                  onChange={(e) => setQubits(parseInt(e.target.value))}
                  className="w-full accent-[#43E5F5]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#8C9BB1] mb-1.5">
                  Repetition Depth (Layers): {depth}
                </label>
                <input
                  type="range"
                  min="1"
                  max="4"
                  value={depth}
                  onChange={(e) => setDepth(parseInt(e.target.value))}
                  className="w-full accent-[#638BFF]"
                />
              </div>
            </div>
          </div>

          {/* Gate Breakdown Badges */}
          <div className="rounded-lg border border-white/5 bg-[#111B2B] p-4 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
            <div>
              <span className="text-[#8C9BB1]">Total Gates: </span>
              <span className="text-white font-bold">{circuitData?.total_gates || 0}</span>
            </div>
            <div>
              <span className="text-[#8C9BB1]">Superposition: </span>
              <span className="text-[#43E5F5]">{qubits * depth} Hadamards (H)</span>
            </div>
            <div>
              <span className="text-[#8C9BB1]">Entangling Pattern: </span>
              <span className="text-purple-400">{currentTpl.entanglement}</span>
            </div>
          </div>

          <div className="flex items-center justify-end">
            <button
              onClick={handleSimulateSmall}
              disabled={simulating}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#43E5F5] to-[#638BFF] px-6 py-2.5 text-xs font-semibold text-[#070B14] hover:opacity-90 disabled:opacity-50 transition-all font-mono"
            >
              {simulating ? (
                <span className="inline-block h-3.5 w-3.5 border-2 border-[#070B14] border-t-transparent rounded-full animate-spin" />
              ) : (
                <Play size={14} />
              )}
              <span>Verify on Local Simulator</span>
            </button>
          </div>
        </div>
      </div>

      {/* Simulator Quick Output */}
      {simOutput && (
        <div className="rounded-xl border border-emerald-500/30 bg-[#0D1422] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold font-mono">
              <CheckCircle2 size={16} />
              <span>Simulation Execution Verified on PennyLane State Vectors</span>
            </div>
            <span className="text-xs font-mono text-[#8C9BB1]">
              Runtime: {simOutput.training_time_seconds}s
            </span>
          </div>
          <pre className="p-3 bg-[#070B14] rounded-lg text-xs font-mono text-[#43E5F5] overflow-x-auto border border-white/5">
            {simOutput.circuit_diagram}
          </pre>
        </div>
      )}

      {/* Gate Sequence Matrix */}
      <div className="rounded-xl border border-white/10 bg-[#0D1422] p-6 space-y-4">
        <h3 className="text-xs font-semibold text-white uppercase font-mono">
          Gate Sequence Timeline
        </h3>
        <div className="overflow-x-auto">
          <div className="flex items-center gap-2 py-3 min-w-max">
            {circuitData?.gates?.map((g: any, i: number) => (
              <div
                key={i}
                className={`flex flex-col items-center justify-center h-14 w-14 rounded-lg border font-mono text-xs ${
                  g.gate === "H"
                    ? "border-[#43E5F5]/40 bg-[#43E5F5]/10 text-[#43E5F5]"
                    : g.gate === "RY" || g.gate === "RZ"
                    ? "border-[#638BFF]/40 bg-[#638BFF]/10 text-[#638BFF]"
                    : "border-purple-500/40 bg-purple-500/10 text-purple-300"
                }`}
              >
                <span className="font-bold">{g.gate}</span>
                <span className="text-[9px] text-[#8C9BB1] truncate max-w-[48px]">
                  q[{g.wires.join(",")}]
                </span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-[11px] text-[#8C9BB1] font-mono">
          Sequential gate applications corresponding directly to unitaries U(x) executed on the quantum register.
        </p>
      </div>
    </div>
  );
}
