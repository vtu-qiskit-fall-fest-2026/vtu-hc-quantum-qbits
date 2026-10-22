"use client";

import React, { useState } from "react";
import { api } from "@/lib/api";
import {
  Cpu,
  Play,
  RotateCcw,
  Sparkles,
  Info,
  AlertCircle,
  Binary,
  Layers,
  CheckCircle2,
  GitCompare,
} from "lucide-react";

export default function QuantumExperimentsPage() {
  const [qubits, setQubits] = useState(4);
  const [depth, setDepth] = useState(2);
  const [encoding, setEncoding] = useState("angle_embedding_cz");
  const [sampleSize, setSampleSize] = useState(30);
  const [randomSeed, setRandomSeed] = useState(42);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunQuantum = async () => {
    setError(null);
    setRunning(true);
    try {
      const data = await api.runQuantumExperiment({
        name: `Quantum Kernel QSVC (${qubits}Q, depth ${depth})`,
        qubit_count: qubits,
        circuit_depth: depth,
        encoding_strategy: encoding,
        sample_size: sampleSize,
        random_seed: randomSeed,
      });
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Quantum experiment failed.");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-white/10 pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Quantum Machine Learning Experiments
        </h1>
        <p className="text-sm text-[#8C9BB1] mt-1">
          Execute genuine PennyLane quantum kernel classifiers using state fidelity overlaps on molecular PCA features.
        </p>
      </div>

      {/* Parameter Control Panel */}
      <div className="rounded-xl border border-white/10 bg-[#0D1422] p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div>
            <h2 className="text-sm font-semibold text-white uppercase font-mono">
              Quantum Simulator Configuration
            </h2>
            <p className="text-xs text-[#8C9BB1] mt-0.5">
              PennyLane State Vector Simulator (default.qubit) · Pure State Fidelity Kernel
            </p>
          </div>
          <span className="text-xs font-mono text-[#43E5F5] bg-[#111B2B] px-3 py-1 rounded border border-[#43E5F5]/20">
            Simulator: Exact State Vectors
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Qubit Count */}
          <div>
            <label className="block text-xs font-medium text-[#8C9BB1] mb-1.5 font-mono">
              Qubits (Wires): {qubits}
            </label>
            <input
              type="range"
              min="2"
              max="6"
              value={qubits}
              onChange={(e) => setQubits(parseInt(e.target.value))}
              className="w-full accent-[#43E5F5]"
            />
            <span className="text-[10px] text-[#8C9BB1] font-mono">2 to 6 qubits</span>
          </div>

          {/* Circuit Depth */}
          <div>
            <label className="block text-xs font-medium text-[#8C9BB1] mb-1.5 font-mono">
              Circuit Depth (Layers): {depth}
            </label>
            <input
              type="range"
              min="1"
              max="4"
              value={depth}
              onChange={(e) => setDepth(parseInt(e.target.value))}
              className="w-full accent-[#638BFF]"
            />
            <span className="text-[10px] text-[#8C9BB1] font-mono">1 to 4 repetitions</span>
          </div>

          {/* Encoding Strategy */}
          <div>
            <label className="block text-xs font-medium text-[#8C9BB1] mb-1.5 font-mono">
              Feature Map Encoding
            </label>
            <select
              value={encoding}
              onChange={(e) => setEncoding(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#111B2B] px-3 py-2 text-sm text-white focus:border-[#43E5F5] focus:outline-none"
            >
              <option value="angle_embedding_cz">Angle Embedding (RY + CZ)</option>
              <option value="zz_feature_map">Havlíček ZZ Feature Map</option>
              <option value="iqp_embedding">IQP Polynomial Embedding</option>
            </select>
          </div>

          {/* Sample Size (Fair simulation limit) */}
          <div>
            <label className="block text-xs font-medium text-[#8C9BB1] mb-1.5 font-mono">
              Sample Cohort: {sampleSize}
            </label>
            <input
              type="range"
              min="16"
              max="60"
              step="4"
              value={sampleSize}
              onChange={(e) => setSampleSize(parseInt(e.target.value))}
              className="w-full accent-emerald-400"
            />
            <span className="text-[10px] text-[#8C9BB1] font-mono">Balanced class sample</span>
          </div>

          {/* Random Seed */}
          <div>
            <label className="block text-xs font-medium text-[#8C9BB1] mb-1.5 font-mono">
              Random Seed
            </label>
            <input
              type="number"
              value={randomSeed}
              onChange={(e) => setRandomSeed(parseInt(e.target.value) || 42)}
              className="w-full rounded-lg border border-white/10 bg-[#111B2B] px-3 py-2 text-sm text-white font-mono focus:border-[#43E5F5] focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-[#8C9BB1] font-mono">
            Gram Matrix Size: {sampleSize}x{sampleSize} fidelity evaluations (|<span className="text-[#43E5F5]">ψ(x)</span>|
            <span className="text-[#638BFF]">ψ(x')</span>|²)
          </div>

          <button
            onClick={handleRunQuantum}
            disabled={running}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#43E5F5] to-[#638BFF] px-6 py-2.5 text-xs font-semibold text-[#070B14] hover:opacity-90 disabled:opacity-50 transition-all shadow-md shadow-[#43E5F5]/20"
          >
            {running ? (
              <span className="inline-block h-4 w-4 border-2 border-[#070B14] border-t-transparent rounded-full animate-spin" />
            ) : (
              <Play size={14} />
            )}
            <span>{running ? "Computing Quantum Kernels..." : "Execute Quantum Run"}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-400 flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Results Dashboard */}
      {result && (
        <div className="space-y-6">
          {/* Top Quantum Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="rounded-xl border border-[#43E5F5]/30 bg-[#0D1422] p-5 glow-cyan-border">
              <span className="text-[10px] font-mono uppercase text-[#43E5F5]">Quantum Accuracy</span>
              <div className="mt-2 text-3xl font-bold font-mono text-white">
                {(result.metrics.accuracy * 100).toFixed(1)}%
              </div>
              <span className="text-[11px] text-[#8C9BB1]">Held-Out Test Set</span>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#0D1422] p-5">
              <span className="text-[10px] font-mono uppercase text-[#8C9BB1]">F1 Score</span>
              <div className="mt-2 text-3xl font-bold font-mono text-[#638BFF]">
                {result.metrics.f1.toFixed(3)}
              </div>
              <span className="text-[11px] text-[#8C9BB1]">Harmonic Precision/Recall</span>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#0D1422] p-5">
              <span className="text-[10px] font-mono uppercase text-[#8C9BB1]">Precision / Recall</span>
              <div className="mt-2 text-xl font-bold font-mono text-white">
                {result.metrics.precision.toFixed(2)} / {result.metrics.recall.toFixed(2)}
              </div>
              <span className="text-[11px] text-[#8C9BB1]">Binary Solubility Task</span>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#0D1422] p-5">
              <span className="text-[10px] font-mono uppercase text-[#8C9BB1]">Simulation Runtime</span>
              <div className="mt-2 text-3xl font-bold font-mono text-emerald-400">
                {result.training_time_seconds}s
              </div>
              <span className="text-[11px] text-[#8C9BB1]">Simulator Overhead</span>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#0D1422] p-5">
              <span className="text-[10px] font-mono uppercase text-[#8C9BB1]">Circuit Parameters</span>
              <div className="mt-2 text-xl font-bold font-mono text-white">
                {result.qubit_count}Q · L={result.circuit_depth}
              </div>
              <span className="text-[11px] text-[#8C9BB1] truncate font-mono">
                {result.encoding_strategy.replace(/_/g, " ")}
              </span>
            </div>
          </div>

          {/* Two Columns: Confusion Matrix & Classical Baseline Fair Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Confusion Matrix */}
            <div className="rounded-xl border border-white/10 bg-[#0D1422] p-6 flex flex-col justify-between">
              <h3 className="text-xs font-semibold text-white uppercase font-mono mb-4">
                Test Set Confusion Matrix
              </h3>
              <div className="flex items-center justify-center p-6">
                <div className="grid grid-cols-2 gap-3 text-center font-mono">
                  <div className="rounded-lg border border-white/10 bg-[#111B2B] p-4">
                    <div className="text-2xl font-bold text-white">
                      {result.metrics.confusion_matrix[0][0]}
                    </div>
                    <div className="text-[10px] text-[#8C9BB1] mt-1">True Negative (Low Sol)</div>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-[#111B2B] p-4">
                    <div className="text-2xl font-bold text-amber-400">
                      {result.metrics.confusion_matrix[0][1]}
                    </div>
                    <div className="text-[10px] text-[#8C9BB1] mt-1">False Positive</div>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-[#111B2B] p-4">
                    <div className="text-2xl font-bold text-amber-400">
                      {result.metrics.confusion_matrix[1][0]}
                    </div>
                    <div className="text-[10px] text-[#8C9BB1] mt-1">False Negative</div>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-[#111B2B] p-4">
                    <div className="text-2xl font-bold text-emerald-400">
                      {result.metrics.confusion_matrix[1][1]}
                    </div>
                    <div className="text-[10px] text-[#8C9BB1] mt-1">True Positive (High Sol)</div>
                  </div>
                </div>
              </div>
              <div className="text-[11px] text-[#8C9BB1] font-mono text-center">
                Evaluated on {result.metrics.n_test_samples} held-out compounds (stratified split).
              </div>
            </div>

            {/* Fair Comparison: Quantum vs Classical Baselines */}
            <div className="rounded-xl border border-white/10 bg-[#0D1422] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-white uppercase font-mono">
                  Identical Split Classical Baselines
                </h3>
                <span className="text-[10px] text-emerald-400 font-mono bg-[#111B2B] px-2 py-0.5 rounded border border-white/5">
                  Fair Evaluation
                </span>
              </div>
              <p className="text-xs text-[#8C9BB1]">
                Benchmarked against standard classical classifiers on the identical train/test split.
              </p>

              <div className="space-y-3 pt-2">
                {/* Quantum QSVC */}
                <div className="rounded-lg border border-[#43E5F5]/30 bg-[#111B2B] p-3.5 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#43E5F5] font-mono">
                      PennyLane Quantum Kernel QSVC
                    </div>
                    <div className="text-[10px] text-[#8C9BB1]">
                      {result.qubit_count} Qubits · State Fidelity Overlap
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-base font-bold text-white">
                      {(result.metrics.accuracy * 100).toFixed(1)}% Acc
                    </span>
                    <div className="text-[10px] text-[#8C9BB1]">F1: {result.metrics.f1.toFixed(3)}</div>
                  </div>
                </div>

                {/* Classical RBF SVM */}
                <div className="rounded-lg border border-white/10 bg-[#111B2B] p-3.5 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white font-mono">
                      Classical Support Vector Classifier (RBF)
                    </div>
                    <div className="text-[10px] text-[#8C9BB1]">Same PCA-reduced components</div>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-base font-bold text-white">
                      {(result.classical_baselines.rbf_svm.accuracy * 100).toFixed(1)}% Acc
                    </span>
                    <div className="text-[10px] text-[#8C9BB1]">
                      F1: {result.classical_baselines.rbf_svm.f1.toFixed(3)}
                    </div>
                  </div>
                </div>

                {/* Classical Random Forest */}
                <div className="rounded-lg border border-white/10 bg-[#111B2B] p-3.5 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white font-mono">
                      Classical Random Forest Classifier
                    </div>
                    <div className="text-[10px] text-[#8C9BB1]">Raw 256-bit Morgan Fingerprints</div>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-base font-bold text-white">
                      {(result.classical_baselines.random_forest.accuracy * 100).toFixed(1)}% Acc
                    </span>
                    <div className="text-[10px] text-[#8C9BB1]">
                      F1: {result.classical_baselines.random_forest.f1.toFixed(3)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Genuine Circuit Diagram Output */}
          <div className="rounded-xl border border-white/10 bg-[#0D1422] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold text-white uppercase font-mono">
                  Executed Quantum Circuit Architecture
                </h3>
                <p className="text-xs text-[#8C9BB1]">
                  Exact PennyLane circuit evaluated for each sample vector.
                </p>
              </div>
              <span className="text-[10px] font-mono text-[#43E5F5] bg-[#111B2B] px-2 py-0.5 rounded border border-white/5">
                {result.gates.length} Gates in Feature Map
              </span>
            </div>

            <pre className="w-full overflow-x-auto rounded-lg bg-[#070B14] p-4 text-xs font-mono text-[#43E5F5] border border-white/10 leading-relaxed">
              {result.circuit_diagram}
            </pre>
          </div>

          {/* Scientific Disclaimer (Mandatory) */}
          <div className="rounded-xl border border-white/10 bg-[#090F1B] p-4 flex items-start gap-3">
            <Info size={16} className="text-[#43E5F5] shrink-0 mt-0.5" />
            <div className="text-xs text-[#8C9BB1] leading-relaxed">
              <span className="text-white font-semibold">Scientific Rigor Notice: </span>
              In accordance with scientific integrity guidelines, no unverified "quantum advantage" or exponential speedup is claimed. Simulation on classical CPUs incurs polynomial state-vector overhead. Current QML demonstrates feature space projection through high-dimensional Hilbert spaces.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
