"use client";

import React, { useState } from "react";
import { api } from "@/lib/api";
import {
  TrendingUp,
  Play,
  RotateCcw,
  Sparkles,
  Info,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Search,
} from "lucide-react";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";

export default function PredictionPage() {
  const [modelType, setModelType] = useState<"random_forest" | "ridge" | "dummy">("random_forest");
  const [testSplit, setTestSplit] = useState(0.2);
  const [randomSeed, setRandomSeed] = useState(42);
  const [nEstimators, setNEstimators] = useState(100);
  const [training, setTraining] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Prediction on unseen SMILES
  const [predSmiles, setPredSmiles] = useState("CCO"); // Ethanol
  const [predicting, setPredicting] = useState(false);
  const [predictionResult, setPredictionResult] = useState<any>(null);
  const [predError, setPredError] = useState<string | null>(null);

  const handleTrain = async () => {
    setError(null);
    setTraining(true);
    try {
      const data = await api.trainClassicalModel({
        model_type: modelType,
        test_size: testSplit,
        random_state: randomSeed,
        n_estimators: nEstimators,
      });
      setResults(data);
    } catch (err: any) {
      setError(err.message || "Model training failed.");
    } finally {
      setTraining(false);
    }
  };

  const handlePredict = async () => {
    setPredError(null);
    setPredicting(true);
    try {
      const res = await api.predictSolubility(predSmiles);
      setPredictionResult(res);
    } catch (err: any) {
      setPredError(err.message || "Prediction failed for provided SMILES.");
      setPredictionResult(null);
    } finally {
      setPredicting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-white/10 pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Classical Property Prediction
        </h1>
        <p className="text-sm text-[#8C9BB1] mt-1">
          Predict aqueous solubility (logS mol/L) on the benchmark Delaney / ESOL dataset using Random Forest, Ridge, and Dummy baselines.
        </p>
      </div>

      {/* Model Configuration & Training Panel */}
      <div className="rounded-xl border border-white/10 bg-[#0D1422] p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div>
            <h2 className="text-sm font-semibold text-white uppercase font-mono">
              Model Training Configuration
            </h2>
            <p className="text-xs text-[#8C9BB1] mt-0.5">
              Standardized Delaney ESOL (1,128 compounds) · Zero Data Leakage Scaler
            </p>
          </div>
          <span className="text-xs font-mono text-[#638BFF] bg-[#111B2B] px-3 py-1 rounded border border-[#638BFF]/20">
            Target: log(mols/L)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Model Type */}
          <div>
            <label className="block text-xs font-medium text-[#8C9BB1] mb-1.5 font-mono">
              Algorithm / Architecture
            </label>
            <select
              value={modelType}
              onChange={(e: any) => setModelType(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#111B2B] px-3 py-2 text-sm text-white focus:border-[#43E5F5] focus:outline-none"
            >
              <option value="random_forest">Random Forest Regressor</option>
              <option value="ridge">Ridge Regression (L2 Regularized)</option>
              <option value="dummy">Dummy Regressor (Mean Baseline)</option>
            </select>
          </div>

          {/* Test Split */}
          <div>
            <label className="block text-xs font-medium text-[#8C9BB1] mb-1.5 font-mono">
              Held-Out Test Ratio: {Math.round(testSplit * 100)}%
            </label>
            <input
              type="range"
              min="0.1"
              max="0.4"
              step="0.05"
              value={testSplit}
              onChange={(e) => setTestSplit(parseFloat(e.target.value))}
              className="w-full accent-[#43E5F5]"
            />
          </div>

          {/* Random Seed */}
          <div>
            <label className="block text-xs font-medium text-[#8C9BB1] mb-1.5 font-mono">
              Random Seed (Reproducibility)
            </label>
            <input
              type="number"
              value={randomSeed}
              onChange={(e) => setRandomSeed(parseInt(e.target.value) || 42)}
              className="w-full rounded-lg border border-white/10 bg-[#111B2B] px-3 py-2 text-sm text-white font-mono focus:border-[#43E5F5] focus:outline-none"
            />
          </div>

          {/* N Estimators (for RF) */}
          <div>
            <label className="block text-xs font-medium text-[#8C9BB1] mb-1.5 font-mono">
              Trees (Random Forest)
            </label>
            <input
              type="number"
              disabled={modelType !== "random_forest"}
              value={nEstimators}
              onChange={(e) => setNEstimators(parseInt(e.target.value) || 100)}
              className="w-full rounded-lg border border-white/10 bg-[#111B2B] px-3 py-2 text-sm text-white font-mono focus:border-[#43E5F5] focus:outline-none disabled:opacity-40"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-[#8C9BB1] font-mono">
            Features: 512-bit Morgan Fingerprints (R=2) + 6 Physicochemical Descriptors
          </div>
          <button
            onClick={handleTrain}
            disabled={training}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#43E5F5] to-[#638BFF] px-6 py-2.5 text-xs font-semibold text-[#070B14] hover:opacity-90 disabled:opacity-50 transition-all shadow-md shadow-[#43E5F5]/20"
          >
            {training ? (
              <span className="inline-block h-4 w-4 border-2 border-[#070B14] border-t-transparent rounded-full animate-spin" />
            ) : (
              <Play size={14} />
            )}
            <span>Execute Training & Evaluation</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-400 flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Held-Out Test Evaluation Results */}
      {results && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="rounded-xl border border-white/10 bg-[#0D1422] p-5">
              <span className="text-[10px] font-mono uppercase text-[#8C9BB1]">Coefficient of Determination</span>
              <div className="mt-2 text-3xl font-bold font-mono text-[#43E5F5]">
                {results.metrics.r2}
              </div>
              <span className="text-[11px] text-[#8C9BB1]">R² Test Score</span>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#0D1422] p-5">
              <span className="text-[10px] font-mono uppercase text-[#8C9BB1]">Mean Absolute Error</span>
              <div className="mt-2 text-3xl font-bold font-mono text-[#638BFF]">
                {results.metrics.mae}
              </div>
              <span className="text-[11px] text-[#8C9BB1]">log(mol/L)</span>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#0D1422] p-5">
              <span className="text-[10px] font-mono uppercase text-[#8C9BB1]">Root Mean Squared Error</span>
              <div className="mt-2 text-3xl font-bold font-mono text-purple-400">
                {results.metrics.rmse}
              </div>
              <span className="text-[11px] text-[#8C9BB1]">log(mol/L)</span>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#0D1422] p-5">
              <span className="text-[10px] font-mono uppercase text-[#8C9BB1]">Evaluation Split</span>
              <div className="mt-2 text-3xl font-bold font-mono text-white">
                {results.metrics.n_test_samples}
              </div>
              <span className="text-[11px] text-[#8C9BB1]">
                Test / {results.metrics.n_train_samples} Train
              </span>
            </div>
          </div>

          {/* Diagnostic Charts: Actual vs Predicted & Residual Plot */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Actual vs Predicted Scatter */}
            <div className="rounded-xl border border-white/10 bg-[#0D1422] p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-white uppercase font-mono">
                  Actual vs. Predicted Solubility
                </span>
                <span className="text-[10px] text-[#43E5F5] font-mono bg-[#111B2B] px-2 py-0.5 rounded border border-white/5">
                  Identity Line (y=x)
                </span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1B293E" />
                    <XAxis
                      type="number"
                      dataKey="actual"
                      name="Actual logS"
                      stroke="#8C9BB1"
                      tick={{ fontSize: 11 }}
                      domain={[-10, 2]}
                    />
                    <YAxis
                      type="number"
                      dataKey="predicted"
                      name="Predicted logS"
                      stroke="#8C9BB1"
                      tick={{ fontSize: 11 }}
                      domain={[-10, 2]}
                    />
                    <Tooltip
                      cursor={{ strokeDasharray: "3 3" }}
                      contentStyle={{
                        backgroundColor: "#111B2B",
                        borderColor: "rgba(67, 229, 245, 0.2)",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <ReferenceLine x={0} stroke="#2A3A4D" />
                    <Scatter
                      name="Compounds"
                      data={results.actual_vs_predicted}
                      fill="#43E5F5"
                      fillOpacity={0.8}
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-2 text-[11px] text-[#8C9BB1] text-center font-mono">
                Points clustering tightly along diagonal indicate superior model predictive fidelity.
              </p>
            </div>

            {/* Residuals Plot */}
            <div className="rounded-xl border border-white/10 bg-[#0D1422] p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-white uppercase font-mono">
                  Residuals Diagnostic Plot
                </span>
                <span className="text-[10px] text-[#638BFF] font-mono bg-[#111B2B] px-2 py-0.5 rounded border border-white/5">
                  Zero Line (Error = 0)
                </span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1B293E" />
                    <XAxis
                      type="number"
                      dataKey="predicted"
                      name="Predicted logS"
                      stroke="#8C9BB1"
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis
                      type="number"
                      dataKey="residual"
                      name="Residual (Pred - Actual)"
                      stroke="#8C9BB1"
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip
                      cursor={{ strokeDasharray: "3 3" }}
                      contentStyle={{
                        backgroundColor: "#111B2B",
                        borderColor: "rgba(99, 139, 255, 0.2)",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <ReferenceLine y={0} stroke="#638BFF" strokeDasharray="3 3" />
                    <Scatter
                      name="Residuals"
                      data={results.residuals}
                      fill="#638BFF"
                      fillOpacity={0.8}
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-2 text-[11px] text-[#8C9BB1] text-center font-mono">
                Homoscedastic distribution around residual=0 demonstrates balanced variance.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Unseen Molecule Solubility Inference Tool */}
      <div className="rounded-xl border border-white/10 bg-[#0D1422] p-6 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-white uppercase font-mono">
            Unseen Molecule Inference
          </h2>
          <p className="text-xs text-[#8C9BB1]">
            Evaluate solubility on an arbitrary user-submitted SMILES string using the active trained model.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={predSmiles}
            onChange={(e) => setPredSmiles(e.target.value)}
            placeholder="e.g. CCO (Ethanol), c1ccccc1O (Phenol)"
            className="flex-1 rounded-lg border border-white/10 bg-[#111B2B] px-4 py-2 text-sm text-white font-mono focus:border-[#43E5F5] focus:outline-none"
          />
          <button
            onClick={handlePredict}
            disabled={predicting || !predSmiles.trim()}
            className="flex items-center justify-center gap-2 rounded-lg bg-[#43E5F5] px-6 py-2 text-xs font-semibold text-[#070B14] hover:bg-[#43E5F5]/90 disabled:opacity-50 transition-all font-mono"
          >
            {predicting ? (
              <span className="inline-block h-3.5 w-3.5 border-2 border-[#070B14] border-t-transparent rounded-full animate-spin" />
            ) : (
              <Search size={14} />
            )}
            <span>Predict logS</span>
          </button>
        </div>

        {predError && (
          <div className="text-xs text-red-400 rounded-lg bg-red-500/10 p-3 border border-red-500/20">
            {predError}
          </div>
        )}

        {predictionResult && (
          <div className="mt-4 rounded-xl border border-[#43E5F5]/30 bg-[#111B2B] p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono text-[#8C9BB1] uppercase">Predicted Solubility</span>
              <div className="text-2xl font-bold font-mono text-[#43E5F5]">
                {predictionResult.predicted_solubility_logS} log(mol/L)
              </div>
              <div className="text-xs text-emerald-400 mt-1 font-mono">
                {predictionResult.interpretation}
              </div>
            </div>
            <div className="text-right text-xs text-[#8C9BB1] font-mono">
              Model: <span className="text-white capitalize">{predictionResult.model_used}</span>
              <br />
              SMILES: <span className="text-white">{predictionResult.smiles}</span>
            </div>
          </div>
        )}
      </div>

      {/* Scientific Provenance & Units Info */}
      <div className="rounded-xl border border-white/5 bg-[#090F1B] p-5 text-xs text-[#8C9BB1] space-y-2 font-mono">
        <div className="text-white font-semibold flex items-center gap-2">
          <Info size={14} className="text-[#43E5F5]" />
          <span>Dataset Provenance & Benchmark Notes</span>
        </div>
        <p>
          Reference: Delaney, J. S. (2004). ESOL: Estimating aqueous solubility directly from molecular structure. J. Chem. Inf. Comput. Sci., 44(3), 1000-1005.
        </p>
        <p>
          Target Property: Log aqueous solubility in mols per litre (logS). Preprocessing scaler is strictly fitted to training splits to preclude any data leakage.
        </p>
      </div>
    </div>
  );
}
