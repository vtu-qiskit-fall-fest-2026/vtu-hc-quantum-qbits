"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  BookmarkCheck,
  Search,
  Trash2,
  Edit2,
  FileDown,
  Copy,
  Check,
  Atom,
  Tag,
  ExternalLink,
  X,
} from "lucide-react";

export default function SavedMoleculesPage() {
  const [molecules, setMolecules] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Edit Modal State
  const [editingMol, setEditingMol] = useState<any>(null);
  const [editName, setEditName] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editTags, setEditTags] = useState("");

  useEffect(() => {
    loadMolecules();
  }, [search, sortBy, sortOrder]);

  const loadMolecules = async () => {
    try {
      setLoading(true);
      const data = await api.getSavedMolecules(search || undefined, sortBy, sortOrder);
      setMolecules(data);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this saved molecule?")) return;
    try {
      await api.deleteSavedMolecule(id);
      setMolecules(molecules.filter((m) => m.id !== id));
    } catch (e: any) {
      alert("Failed to delete molecule: " + e.message);
    }
  };

  const handleCopySmiles = (smiles: string, id: string) => {
    navigator.clipboard.writeText(smiles);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openEditModal = (mol: any) => {
    setEditingMol(mol);
    setEditName(mol.name || "");
    setEditNotes(mol.notes || "");
    setEditTags(Array.isArray(mol.tags) ? mol.tags.join(", ") : "");
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMol) return;
    try {
      const tagList = editTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const updated = await api.updateSavedMolecule(editingMol.id, {
        name: editName,
        notes: editNotes,
        tags: tagList,
      });
      setMolecules(molecules.map((m) => (m.id === updated.id ? updated : m)));
      setEditingMol(null);
    } catch (err: any) {
      alert("Update failed: " + err.message);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Saved Molecules Library</h1>
          <p className="text-sm text-[#8C9BB1] mt-1">
            Private per-user compound collection with verified 2D depictions, notes, and descriptors.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={api.exportSavedMoleculesUrl("csv")}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#111B2B] px-3.5 py-2 text-xs font-semibold text-[#F2F6FC] hover:border-[#43E5F5]/40 transition-colors"
          >
            <FileDown size={14} className="text-[#43E5F5]" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* Search and Sort Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0D1422] p-4 rounded-xl border border-white/10">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={14} className="absolute left-3.5 top-3 text-[#8C9BB1]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by compound name, SMILES, formula, or notes..."
            className="w-full rounded-lg border border-white/10 bg-[#111B2B] pl-9 pr-4 py-2 text-xs text-white placeholder-[#8C9BB1]/50 focus:border-[#43E5F5] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs text-[#8C9BB1] font-mono">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-lg border border-white/10 bg-[#111B2B] px-3 py-1.5 text-xs text-white focus:outline-none"
          >
            <option value="created_at">Date Added</option>
            <option value="molecular_weight">Molecular Weight</option>
            <option value="logp">LogP</option>
            <option value="tpsa">TPSA</option>
          </select>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="rounded-lg border border-white/10 bg-[#111B2B] px-3 py-1.5 text-xs text-white focus:outline-none"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </div>

      {/* Grid of Saved Molecules */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#43E5F5] border-t-transparent" />
        </div>
      ) : molecules.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-[#0D1422] p-8 text-center text-xs text-[#8C9BB1]">
          No saved molecules in your collection yet. Search and analyze compounds in the Molecular Explorer to save them here.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {molecules.map((mol) => (
            <div
              key={mol.id}
              className="rounded-xl border border-white/10 bg-[#0D1422] p-5 flex flex-col justify-between hover:border-[#43E5F5]/30 transition-all space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-white truncate max-w-[200px]">
                    {mol.name}
                  </h3>
                  <span className="text-xs font-mono text-[#43E5F5] bg-[#111B2B] px-2 py-0.5 rounded border border-white/5">
                    {mol.formula}
                  </span>
                </div>

                {/* 2D SVG Depiction thumbnail */}
                {mol.svg_depiction && (
                  <div
                    className="w-full h-36 flex items-center justify-center rounded-lg bg-[#070B14] p-2 border border-white/5 my-3"
                    dangerouslySetInnerHTML={{ __html: mol.svg_depiction }}
                  />
                )}

                <div className="text-[11px] font-mono text-[#8C9BB1] truncate mt-1">
                  {mol.smiles}
                </div>

                {/* Descriptors mini pill grid */}
                <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono my-3">
                  <div className="bg-[#111B2B] p-1.5 rounded border border-white/5">
                    <span className="text-[#8C9BB1]">MW:</span> {mol.molecular_weight}
                  </div>
                  <div className="bg-[#111B2B] p-1.5 rounded border border-white/5">
                    <span className="text-[#8C9BB1]">LogP:</span> {mol.logp}
                  </div>
                  <div className="bg-[#111B2B] p-1.5 rounded border border-white/5">
                    <span className="text-[#8C9BB1]">TPSA:</span> {mol.tpsa}
                  </div>
                </div>

                {mol.notes && (
                  <p className="text-xs text-[#8C9BB1]/80 italic line-clamp-2 bg-[#111B2B]/40 p-2 rounded">
                    "{mol.notes}"
                  </p>
                )}

                {mol.tags && mol.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {mol.tags.map((t: string) => (
                      <span
                        key={t}
                        className="text-[9px] font-mono bg-[#43E5F5]/10 text-[#43E5F5] px-1.5 py-0.5 rounded border border-[#43E5F5]/20"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between border-t border-white/5 pt-3">
                <button
                  onClick={() => handleCopySmiles(mol.smiles, mol.id)}
                  className="flex items-center gap-1 text-[11px] font-mono text-[#8C9BB1] hover:text-[#43E5F5]"
                >
                  {copiedId === mol.id ? (
                    <Check size={12} className="text-emerald-400" />
                  ) : (
                    <Copy size={12} />
                  )}
                  <span>{copiedId === mol.id ? "Copied" : "Copy"}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(mol)}
                    className="p-1 text-[#8C9BB1] hover:text-white"
                    title="Edit Notes & Tags"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(mol.id)}
                    className="p-1 text-[#8C9BB1] hover:text-red-400"
                    title="Delete Molecule"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingMol && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0D1422] p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-3">Edit Saved Molecule</h3>
            <form onSubmit={handleUpdate} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#8C9BB1] mb-1">Compound Label</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#111B2B] px-3 py-2 text-sm text-white focus:border-[#43E5F5] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#8C9BB1] mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#111B2B] px-3 py-2 text-sm text-white focus:border-[#43E5F5] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#8C9BB1] mb-1">Notes</label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#111B2B] px-3 py-2 text-sm text-white focus:border-[#43E5F5] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingMol(null)}
                  className="px-4 py-2 text-[#8C9BB1] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#43E5F5] px-5 py-2 font-semibold text-[#070B14] hover:bg-[#43E5F5]/90"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
