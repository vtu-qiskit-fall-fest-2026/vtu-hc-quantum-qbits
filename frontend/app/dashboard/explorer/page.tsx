"use client";

import React, { useState } from "react";
import { api } from "@/lib/api";
import Molecular3DViewer from "@/components/molecular-3d-viewer";
import {
  Atom,
  Search,
  Copy,
  Check,
  BookmarkPlus,
  FileDown,
  Info,
  AlertCircle,
  Sparkles,
  Layers,
  ChevronRight,
} from "lucide-react";

// Curated Cheminformatics Presets
const PRESET_MOLECULES = [
  { name: "Aspirin (Acetylsalicylic Acid)", smiles: "CC(=O)Oc1ccccc1C(=O)O" },
  { name: "Caffeine", smiles: "CN1C=NC2=C1C(=O)N(C(=O)N2C)C" },
  { name: "Paracetamol (Acetaminophen)", smiles: "CC(=O)Nc1ccc(O)cc1" },
  { name: "Ibuprofen", smiles: "CC(C)Cc1ccc(cc1)C(C)C(=O)O" },
  { name: "Benzene", smiles: "c1ccccc1" },
  { name: "Nicotine", smiles: "CN1CCCC1c2cccnc2" },
];

export default function MolecularExplorerPage() {
  const [smiles, setSmiles] = useState("CC(=O)Oc1ccccc1C(=O)O");
  const [analyzing, setAnalyzing] = useState(false);
  const [descriptors, setDescriptors] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Save Modal States
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [molName, setMolName] = useState("");
  const [molNotes, setMolNotes] = useState("");
  const [molTags, setMolTags] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Compute descriptors on first load if not computed
  React.useEffect(() => {
    handleCompute(smiles);
  }, []);

  const handleCompute = async (smilesString: string) => {
    setError(null);
    setSaveSuccess(false);
    setAnalyzing(true);
    try {
      const data = await api.computeDescriptors(smilesString);
      setDescriptors(data);
      setMolName(`Compound-${data.formula}`);
    } catch (err: any) {
      setError(err.message || "Invalid SMILES or computation failed.");
      setDescriptors(null);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCopySmiles = () => {
    if (descriptors?.canonical_smiles) {
      navigator.clipboard.writeText(descriptors.canonical_smiles);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descriptors) return;
    try {
      const tagList = molTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      await api.saveMolecule({
        smiles: descriptors.canonical_smiles,
        name: molName || `Mol-${descriptors.formula}`,
        notes: molNotes,
        tags: tagList,
      });
      setSaveSuccess(true);
      setSaveModalOpen(false);
    } catch (err: any) {
      setError(err.message || "Failed to save molecule.");
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-white/10 pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-white">Molecular Explorer</h1>
        <p className="text-sm text-[#8C9BB1] mt-1">
          Compute physicochemical descriptors, 2D vector topologies, and 3D force-field conformers using RDKit.
        </p>
      </div>

      {/* SMILES Input & Presets */}
      <div className="rounded-xl border border-white/10 bg-[#0D1422] p-6 space-y-4">
        <label className="block text-xs font-semibold text-[#8C9BB1] uppercase font-mono">
          Input Simplified Molecular-Input Line-Entry System (SMILES)
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={smiles}
              onChange={(e) => setSmiles(e.target.value)}
              placeholder="e.g. CC(=O)Oc1ccccc1C(=O)O"
              className="w-full rounded-lg border border-white/10 bg-[#111B2B] px-4 py-2.5 text-sm text-white font-mono placeholder-[#8C9BB1]/40 focus:border-[#43E5F5] focus:outline-none focus:ring-1 focus:ring-[#43E5F5]"
            />
          </div>
          <button
            onClick={() => handleCompute(smiles)}
            disabled={analyzing || !smiles.trim()}
            className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#43E5F5] to-[#638BFF] px-6 py-2.5 text-sm font-semibold text-[#070B14] hover:opacity-90 disabled:opacity-50 transition-all shadow-md shadow-[#43E5F5]/20"
          >
            {analyzing ? (
              <span className="inline-block h-4 w-4 border-2 border-[#070B14] border-t-transparent rounded-full animate-spin" />
            ) : (
              <Search size={16} />
            )}
            <span>Analyze SMILES</span>
          </button>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <span className="text-[11px] text-[#8C9BB1] font-mono">Presets:</span>
          {PRESET_MOLECULES.map((preset) => (
            <button
              key={preset.name}
              onClick={() => {
                setSmiles(preset.smiles);
                handleCompute(preset.smiles);
              }}
              className="text-xs bg-[#111B2B] hover:bg-[#1B293E] text-[#8C9BB1] hover:text-[#43E5F5] px-2.5 py-1 rounded border border-white/5 transition-colors font-mono"
            >
              {preset.name.split(" ")[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-400">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Save Success alert */}
      {saveSuccess && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-400">
          <span>Molecule successfully saved to your private collection!</span>
          <span className="font-mono text-[11px]">Survives application restarts</span>
        </div>
      )}

      {/* Descriptors & Visualizations Workspace */}
      {descriptors && (
        <div className="space-y-6">
          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0D1422] p-4 rounded-xl border border-white/10">
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-white font-mono">{descriptors.formula}</span>
              <span className="text-xs text-[#8C9BB1] font-mono">
                Canonical: {descriptors.canonical_smiles}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopySmiles}
                className="flex items-center gap-1.5 text-xs text-[#8C9BB1] hover:text-[#43E5F5] bg-[#111B2B] px-3 py-1.5 rounded-lg border border-white/10 transition-colors font-mono"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copied ? "Copied" : "Copy SMILES"}</span>
              </button>
              <button
                onClick={() => setSaveModalOpen(true)}
                className="flex items-center gap-1.5 text-xs text-[#070B14] bg-[#43E5F5] hover:bg-[#43E5F5]/90 px-3.5 py-1.5 rounded-lg font-semibold transition-colors shadow-sm shadow-[#43E5F5]/20"
              >
                <BookmarkPlus size={14} />
                <span>Save to Library</span>
              </button>
            </div>
          </div>

          {/* Molecular Visualizations: 2D Depiction & 3D WebGL Viewer */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* 2D Vector Depiction */}
            <div className="lg:col-span-5 rounded-xl border border-white/10 bg-[#0D1422] p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-white uppercase font-mono">
                  2D Topological Depiction
                </span>
                <span className="text-[10px] text-[#43E5F5] font-mono bg-[#111B2B] px-2 py-0.5 rounded border border-white/5">
                  RDKit SVG Vector
                </span>
              </div>
              <div
                className="w-full flex-1 min-h-[260px] flex items-center justify-center rounded-lg bg-[#070B14] p-3 border border-white/5"
                dangerouslySetInnerHTML={{ __html: descriptors.svg_depiction }}
              />
              <p className="mt-3 text-[11px] text-[#8C9BB1] text-center">
                Coordinate-computed 2D diagram with aromatic bond representation
              </p>
            </div>

            {/* Interactive 3D WebGL Conformer */}
            <div className="lg:col-span-7 rounded-xl border border-white/10 bg-[#0D1422] p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-white uppercase font-mono">
                  Interactive 3D Structure
                </span>
                <span className="text-[10px] text-emerald-400 font-mono bg-[#111B2B] px-2 py-0.5 rounded border border-white/5">
                  Distance Geometry + MMFF
                </span>
              </div>
              <Molecular3DViewer
                conformer={descriptors.conformer_3d}
                svgFallback={descriptors.svg_depiction}
                className="h-[280px] w-full"
              />
              <p className="mt-3 text-[11px] text-[#8C9BB1] text-center">
                Energy-minimized conformer. Drag to rotate · Scroll to zoom · CPK atom colors
              </p>
            </div>
          </div>

          {/* Calculated Physicochemical Descriptors Grid */}
          <div className="rounded-xl border border-white/10 bg-[#0D1422] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white uppercase font-mono">
                  Calculated Physicochemical Descriptors
                </h3>
                <p className="text-xs text-[#8C9BB1]">
                  Deterministic parameters calculated via RDKit algorithms.
                </p>
              </div>
              <span className="text-[10px] text-[#43E5F5] font-mono bg-[#111B2B] px-2.5 py-1 rounded border border-[#43E5F5]/20">
                Verified RDKit Descriptors
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="rounded-lg border border-white/10 bg-[#111B2B] p-3.5">
                <span className="text-[10px] font-mono text-[#8C9BB1] uppercase">Mol. Weight</span>
                <div className="mt-1 text-lg font-bold text-white font-mono">
                  {descriptors.molecular_weight}
                </div>
                <span className="text-[10px] text-[#8C9BB1]">g/mol</span>
              </div>

              <div className="rounded-lg border border-white/10 bg-[#111B2B] p-3.5">
                <span className="text-[10px] font-mono text-[#8C9BB1] uppercase">Wildman-Crippen LogP</span>
                <div className="mt-1 text-lg font-bold text-[#43E5F5] font-mono">
                  {descriptors.logp}
                </div>
                <span className="text-[10px] text-[#8C9BB1]">Octanol/Water</span>
              </div>

              <div className="rounded-lg border border-white/10 bg-[#111B2B] p-3.5">
                <span className="text-[10px] font-mono text-[#8C9BB1] uppercase">Polar Surface Area</span>
                <div className="mt-1 text-lg font-bold text-[#638BFF] font-mono">
                  {descriptors.tpsa}
                </div>
                <span className="text-[10px] text-[#8C9BB1]">Å² (TPSA)</span>
              </div>

              <div className="rounded-lg border border-white/10 bg-[#111B2B] p-3.5">
                <span className="text-[10px] font-mono text-[#8C9BB1] uppercase">H-Bond Donors</span>
                <div className="mt-1 text-lg font-bold text-emerald-400 font-mono">
                  {descriptors.hbd}
                </div>
                <span className="text-[10px] text-[#8C9BB1]">HBD count</span>
              </div>

              <div className="rounded-lg border border-white/10 bg-[#111B2B] p-3.5">
                <span className="text-[10px] font-mono text-[#8C9BB1] uppercase">H-Bond Acceptors</span>
                <div className="mt-1 text-lg font-bold text-purple-400 font-mono">
                  {descriptors.hba}
                </div>
                <span className="text-[10px] text-[#8C9BB1]">HBA count</span>
              </div>

              <div className="rounded-lg border border-white/10 bg-[#111B2B] p-3.5">
                <span className="text-[10px] font-mono text-[#8C9BB1] uppercase">Rotatable Bonds</span>
                <div className="mt-1 text-lg font-bold text-amber-400 font-mono">
                  {descriptors.rotatable_bonds}
                </div>
                <span className="text-[10px] text-[#8C9BB1]">Flexibility</span>
              </div>
            </div>

            {/* Additional Secondary Properties */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="text-xs text-[#8C9BB1] font-mono bg-[#111B2B]/50 p-2.5 rounded border border-white/5">
                Heavy Atoms: <span className="text-white font-bold">{descriptors.heavy_atom_count}</span>
              </div>
              <div className="text-xs text-[#8C9BB1] font-mono bg-[#111B2B]/50 p-2.5 rounded border border-white/5">
                Rings: <span className="text-white font-bold">{descriptors.ring_count}</span>
              </div>
              <div className="text-xs text-[#8C9BB1] font-mono bg-[#111B2B]/50 p-2.5 rounded border border-white/5">
                Formal Charge: <span className="text-white font-bold">{descriptors.formal_charge}</span>
              </div>
              <div className="text-xs text-[#8C9BB1] font-mono bg-[#111B2B]/50 p-2.5 rounded border border-white/5">
                Fraction C.sp3: <span className="text-white font-bold">{descriptors.fraction_csp3}</span>
              </div>
            </div>
          </div>

          {/* Scientific Disclaimer (Mandatory) */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-start gap-3">
            <Info size={18} className="text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-300/80 leading-relaxed">
              <span className="font-semibold text-amber-400">Scientific Integrity Notice: </span>
              Calculated molecular descriptors represent mathematical topological and force-field approximations. They do not constitute clinical, biological, or pharmaceutical proof of drug efficacy or human safety.
            </div>
          </div>
        </div>
      )}

      {/* Save Modal */}
      {saveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0D1422] p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Save Molecule to Library</h3>
            <p className="text-xs text-[#8C9BB1] mb-4">
              Persist this compound with custom notes and research tags.
            </p>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs text-[#8C9BB1] mb-1">Compound Label</label>
                <input
                  type="text"
                  value={molName}
                  onChange={(e) => setMolName(e.target.value)}
                  placeholder="e.g. Aspirin Analog A"
                  className="w-full rounded-lg border border-white/10 bg-[#111B2B] px-3 py-2 text-sm text-white focus:border-[#43E5F5] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-[#8C9BB1] mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={molTags}
                  onChange={(e) => setMolTags(e.target.value)}
                  placeholder="e.g. anti-inflammatory, esol_candidate, kinase"
                  className="w-full rounded-lg border border-white/10 bg-[#111B2B] px-3 py-2 text-sm text-white focus:border-[#43E5F5] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-[#8C9BB1] mb-1">Research Notes</label>
                <textarea
                  rows={3}
                  value={molNotes}
                  onChange={(e) => setMolNotes(e.target.value)}
                  placeholder="Notes on synthesis route, logP boundary, or target affinity..."
                  className="w-full rounded-lg border border-white/10 bg-[#111B2B] px-3 py-2 text-sm text-white focus:border-[#43E5F5] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSaveModalOpen(false)}
                  className="px-4 py-2 text-xs text-[#8C9BB1] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#43E5F5] px-5 py-2 text-xs font-semibold text-[#070B14] hover:bg-[#43E5F5]/90 shadow-md shadow-[#43E5F5]/20"
                >
                  Save Molecule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
