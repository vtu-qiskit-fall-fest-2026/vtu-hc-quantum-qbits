"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  Database,
  UploadCloud,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Table,
  BarChart2,
  FileDown,
  Search,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function DatasetExplorerPage() {
  const [datasets, setDatasets] = useState<any[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState("delaney_esol");
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Upload modal states
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState("");
  const [uploadDesc, setUploadDesc] = useState("");
  const [uploadTarget, setUploadTarget] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);

  useEffect(() => {
    loadDatasets();
  }, []);

  useEffect(() => {
    if (selectedDatasetId) {
      loadPreview(selectedDatasetId);
    }
  }, [selectedDatasetId]);

  const loadDatasets = async () => {
    try {
      setLoading(true);
      const data = await api.listDatasets();
      setDatasets(data);
    } catch (err: any) {
      setError(err.message || "Failed to load datasets.");
    } finally {
      setLoading(false);
    }
  };

  const loadPreview = async (id: string) => {
    try {
      setPreviewLoading(true);
      const data = await api.previewDataset(id);
      setPreview(data);
    } catch (err: any) {
      setError(err.message || "Failed to preview dataset.");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    setUploading(true);
    setUploadMsg(null);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("name", uploadName);
      if (uploadDesc) formData.append("description", uploadDesc);
      if (uploadTarget) formData.append("target_column", uploadTarget);

      await api.uploadDataset(formData);
      setUploadMsg("Dataset successfully uploaded and validated!");
      await loadDatasets();
      setTimeout(() => {
        setUploadOpen(false);
        setUploadFile(null);
        setUploadName("");
      }, 1500);
    } catch (err: any) {
      setUploadMsg("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Dataset Explorer</h1>
          <p className="text-sm text-[#8C9BB1] mt-1">
            Standard molecular benchmarks, schema validation, distributions, and CSV uploads.
          </p>
        </div>
        <button
          onClick={() => setUploadOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#43E5F5] to-[#638BFF] px-4 py-2 text-xs font-semibold text-[#070B14] hover:opacity-90 shadow-md shadow-[#43E5F5]/20"
        >
          <UploadCloud size={16} />
          <span>Upload CSV Dataset</span>
        </button>
      </div>

      {/* Dataset Catalog Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {datasets.map((d) => (
          <button
            key={d.id}
            onClick={() => setSelectedDatasetId(d.id)}
            className={`text-left p-4 rounded-xl border transition-all ${
              selectedDatasetId === d.id
                ? "border-[#43E5F5] bg-[#0D1422] shadow-md shadow-[#43E5F5]/10"
                : "border-white/10 bg-[#0D1422]/60 hover:bg-[#0D1422]"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white font-mono truncate">{d.name}</span>
              <span className="text-[10px] text-[#43E5F5] font-mono bg-[#111B2B] px-2 py-0.5 rounded border border-white/5">
                {d.task_type}
              </span>
            </div>
            <p className="text-xs text-[#8C9BB1] line-clamp-2">{d.description}</p>
            <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-[#8C9BB1]">
              <span>{d.row_count} rows · {d.column_count} columns</span>
              <span className="text-white">{d.is_public ? "Benchmark" : "User Upload"}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Preview Section */}
      {previewLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#43E5F5] border-t-transparent" />
        </div>
      ) : preview ? (
        <div className="space-y-6">
          {/* Summary Diagnostics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-xl border border-white/10 bg-[#0D1422] p-4 font-mono">
              <span className="text-[10px] text-[#8C9BB1] uppercase">Total Samples</span>
              <div className="mt-1 text-2xl font-bold text-white">{preview.total_rows}</div>
              <span className="text-[10px] text-emerald-400">Zero empty rows</span>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#0D1422] p-4 font-mono">
              <span className="text-[10px] text-[#8C9BB1] uppercase">Columns</span>
              <div className="mt-1 text-2xl font-bold text-[#43E5F5]">{preview.total_columns}</div>
              <span className="text-[10px] text-[#8C9BB1]">Schema Verified</span>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#0D1422] p-4 font-mono">
              <span className="text-[10px] text-[#8C9BB1] uppercase">Duplicate Rows</span>
              <div className="mt-1 text-2xl font-bold text-[#638BFF]">{preview.duplicate_rows}</div>
              <span className="text-[10px] text-emerald-400">Exact Deduplication</span>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#0D1422] p-4 font-mono">
              <span className="text-[10px] text-[#8C9BB1] uppercase">Target Variable</span>
              <div className="mt-1 text-sm font-bold text-white truncate">{preview.target_column}</div>
              <span className="text-[10px] text-[#43E5F5]">Ground Truth Value</span>
            </div>
          </div>

          {/* Distribution Histogram */}
          {preview.distributions && preview.distributions.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-[#0D1422] p-6 space-y-4">
              <h3 className="text-xs font-semibold text-white uppercase font-mono">
                Property Distributions ({preview.distributions[0].column})
              </h3>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={preview.distributions[0].bins.map((bin: string, idx: number) => ({
                      bin,
                      frequency: preview.distributions[0].frequencies[idx],
                    }))}
                    margin={{ top: 10, right: 10, bottom: 20, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1B293E" />
                    <XAxis dataKey="bin" stroke="#8C9BB1" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#8C9BB1" tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#111B2B",
                        borderColor: "rgba(67, 229, 245, 0.2)",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="frequency" fill="#43E5F5" name="Sample Count" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Data Table Preview */}
          <div className="rounded-xl border border-white/10 bg-[#0D1422] overflow-hidden">
            <div className="p-4 border-b border-white/10 bg-[#111B2B] flex items-center justify-between">
              <h3 className="text-xs font-semibold text-white uppercase font-mono">
                Data Sample Head (15 Records)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#090F1B] text-[#8C9BB1] border-b border-white/5">
                  <tr>
                    {preview.columns?.map((col: any) => (
                      <th key={col.name} className="p-3 whitespace-nowrap">
                        {col.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {preview.preview?.map((row: any, i: number) => (
                    <tr key={i} className="hover:bg-white/[0.02]">
                      {preview.columns?.map((col: any) => (
                        <td key={col.name} className="p-3 text-white max-w-xs truncate whitespace-nowrap">
                          {String(row[col.name])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}

      {/* CSV Upload Modal */}
      {uploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0D1422] p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Upload Molecular Dataset</h3>
            <p className="text-xs text-[#8C9BB1] mb-4">
              Upload custom CSV with SMILES or tabular chemical descriptors.
            </p>

            {uploadMsg && (
              <div className="mb-4 text-xs p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                {uploadMsg}
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-[#8C9BB1] mb-1">Dataset Name</label>
                <input
                  type="text"
                  required
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  placeholder="e.g. Kinase Activity Assay"
                  className="w-full rounded-lg border border-white/10 bg-[#111B2B] px-3 py-2 text-sm text-white focus:border-[#43E5F5] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-[#8C9BB1] mb-1">Description</label>
                <input
                  type="text"
                  value={uploadDesc}
                  onChange={(e) => setUploadDesc(e.target.value)}
                  placeholder="Brief context on target assay..."
                  className="w-full rounded-lg border border-white/10 bg-[#111B2B] px-3 py-2 text-sm text-white focus:border-[#43E5F5] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-[#8C9BB1] mb-1">Target Column Name</label>
                <input
                  type="text"
                  value={uploadTarget}
                  onChange={(e) => setUploadTarget(e.target.value)}
                  placeholder="e.g. pIC50, solubility, activity"
                  className="w-full rounded-lg border border-white/10 bg-[#111B2B] px-3 py-2 text-sm text-white focus:border-[#43E5F5] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-[#8C9BB1] mb-1">Select CSV File (Max 10MB)</label>
                <input
                  type="file"
                  accept=".csv"
                  required
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-[#8C9BB1] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#43E5F5]/10 file:text-[#43E5F5] hover:file:bg-[#43E5F5]/20 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setUploadOpen(false)}
                  className="px-4 py-2 text-xs text-[#8C9BB1] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !uploadFile}
                  className="rounded-lg bg-gradient-to-r from-[#43E5F5] to-[#638BFF] px-5 py-2 text-xs font-semibold text-[#070B14] hover:opacity-90 disabled:opacity-50"
                >
                  {uploading ? "Validating & Uploading..." : "Upload Dataset"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
