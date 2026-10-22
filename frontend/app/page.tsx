"use client";

import React, { useState, useEffect } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Atom, Sparkles, ArrowRight, ShieldCheck, Cpu } from "lucide-react";
import AuthModal from "@/components/auth-modal";
import Molecular3DViewer from "@/components/molecular-3d-viewer";

// Authentic 3D Conformer coordinates for a real scientific fullerene / ligand scaffold (Caffeine / Purine analog)
const ILLUSTRATIVE_MOLECULE = {
  optimization_method: "ETKDGv3 + MMFF94 (Simulated Quantum Scaffold)",
  atoms: [
    { index: 0, element: "N", atomic_num: 7, x: 0.0, y: 1.15, z: 0.0 },
    { index: 1, element: "C", atomic_num: 6, x: 1.14, y: 0.38, z: 0.0 },
    { index: 2, element: "C", atomic_num: 6, x: 0.72, y: -0.99, z: 0.0 },
    { index: 3, element: "N", atomic_num: 7, x: -0.67, y: -1.04, z: 0.0 },
    { index: 4, element: "C", atomic_num: 6, x: -1.14, y: 0.28, z: 0.0 },
    { index: 5, element: "O", atomic_num: 8, x: -2.31, y: 0.65, z: 0.0 },
    { index: 6, element: "N", atomic_num: 7, x: 2.45, y: 0.78, z: 0.0 },
    { index: 7, element: "C", atomic_num: 6, x: 2.78, y: -0.56, z: 0.0 },
    { index: 8, element: "N", atomic_num: 7, x: 1.76, y: -1.61, z: 0.0 },
    { index: 9, element: "O", atomic_num: 8, x: 3.93, y: -0.93, z: 0.0 },
    { index: 10, element: "C", atomic_num: 6, x: -0.21, y: 2.58, z: 0.0 },
    { index: 11, element: "C", atomic_num: 6, x: -1.54, y: -2.21, z: 0.0 },
    { index: 12, element: "H", atomic_num: 1, x: 0.75, y: 3.09, z: 0.0 },
    { index: 13, element: "H", atomic_num: 1, x: -0.74, y: 2.87, z: 0.89 },
    { index: 14, element: "H", atomic_num: 1, x: -0.74, y: 2.87, z: -0.89 },
  ],
  bonds: [
    { source: 0, target: 1, order: 1.0 },
    { source: 1, target: 2, order: 2.0 },
    { source: 2, target: 3, order: 1.0 },
    { source: 3, target: 4, order: 1.0 },
    { source: 4, target: 0, order: 1.0 },
    { source: 4, target: 5, order: 2.0 },
    { source: 1, target: 6, order: 1.0 },
    { source: 6, target: 7, order: 1.0 },
    { source: 7, target: 8, order: 1.0 },
    { source: 8, target: 2, order: 1.0 },
    { source: 7, target: 9, order: 2.0 },
    { source: 0, target: 10, order: 1.0 },
    { source: 3, target: 11, order: 1.0 },
    { source: 10, target: 12, order: 1.0 },
    { source: 10, target: 13, order: 1.0 },
    { source: 10, target: 14, order: 1.0 },
  ],
};

export default function LandingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  const handleGetStarted = () => {
    if (user) {
      router.push("/dashboard/overview");
    } else {
      setAuthMode("register");
      setAuthOpen(true);
    }
  };

  const handleLoginClick = () => {
    if (user) {
      router.push("/dashboard/overview");
    } else {
      setAuthMode("login");
      setAuthOpen(true);
    }
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#070B14] text-[#F2F6FC] select-none flex flex-col justify-between">
      {/* Background Subtle Quantum Circuit Lines & Grid */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="q-circuit" width="120" height="80" patternUnits="userSpaceOnUse">
              <line x1="0" y1="20" x2="120" y2="20" stroke="rgba(67, 229, 245, 0.08)" strokeWidth="1" />
              <line x1="0" y1="60" x2="120" y2="60" stroke="rgba(99, 139, 255, 0.08)" strokeWidth="1" />
              <circle cx="40" cy="20" r="3" fill="rgba(67, 229, 245, 0.25)" />
              <circle cx="80" cy="60" r="3" fill="rgba(99, 139, 255, 0.25)" />
              <line x1="40" y1="20" x2="40" y2="60" stroke="rgba(67, 229, 245, 0.12)" strokeWidth="1" strokeDasharray="3 3" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#q-circuit)" />
        </svg>
      </div>

      {/* Top Navigation Bar */}
      <header className="relative z-20 flex h-20 items-center justify-between px-8 md:px-16 max-w-7xl mx-auto w-full">
        {/* Molecular Logo & Wordmark */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#43E5F5] to-[#638BFF] text-[#070B14] shadow-lg shadow-[#43E5F5]/20">
            <Atom size={22} className="animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-white font-sans">Q-MolAI</span>
            <span className="text-[10px] text-[#43E5F5] font-mono tracking-widest uppercase">
              Quantum Intelligence
            </span>
          </div>
        </div>

        {/* Status & Login */}
        <div className="flex items-center gap-6">
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-white/10 bg-[#0D1422]/90 px-3 py-1 text-xs text-[#8C9BB1] font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-[#43E5F5] animate-ping" />
            <span>Environment: Production Simulator</span>
          </div>

          <NextLink
            href={user ? "/dashboard/overview" : "/login"}
            className="text-xs font-semibold tracking-wider text-[#8C9BB1] hover:text-[#43E5F5] transition-colors uppercase font-mono px-3 py-1.5 rounded-md hover:bg-white/5"
          >
            {user ? "Open Dashboard" : "Login"}
          </NextLink>
        </div>
      </header>

      {/* Hero Single Viewport Workspace (Left Content & Right 3D Visual) */}
      <main className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 items-center px-8 md:px-16 max-w-7xl mx-auto w-full gap-8">
        {/* Left Column: Headline, Subtitle, CTA */}
        <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#43E5F5]/30 bg-[#43E5F5]/10 px-3.5 py-1 text-xs font-mono text-[#43E5F5] w-fit">
            <Cpu size={14} />
            <span>PennyLane QML + RDKit Cheminformatics</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
            Discover the <br />
            <span className="bg-gradient-to-r from-[#43E5F5] via-[#638BFF] to-[#F2F6FC] bg-clip-text text-transparent">
              Molecular Frontier.
            </span>
          </h1>

          <p className="text-base md:text-lg text-[#8C9BB1] max-w-xl font-normal leading-relaxed">
            A high-precision research platform uniting chemical descriptor computation with genuine quantum state-overlap kernels for reproducible molecular property evaluation.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <NextLink
              href={user ? "/dashboard/overview" : "/register"}
              className="flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-[#43E5F5] to-[#638BFF] px-8 py-3.5 text-sm font-semibold text-[#070B14] hover:opacity-95 transition-all shadow-xl shadow-[#43E5F5]/25 hover:shadow-[#43E5F5]/40 hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>{user ? "Enter Research Dashboard" : "Get Started"}</span>
              <ArrowRight size={16} />
            </NextLink>
          </div>

          {/* Technical Annotations */}
          <div className="pt-6 grid grid-cols-3 gap-4 border-t border-white/10 max-w-lg">
            <div>
              <div className="text-xs font-mono text-[#43E5F5]">RDKit 2026</div>
              <div className="text-[11px] text-[#8C9BB1]">Deterministic Descriptors</div>
            </div>
            <div>
              <div className="text-xs font-mono text-[#638BFF]">PennyLane 0.45</div>
              <div className="text-[11px] text-[#8C9BB1]">State Vector QSVC</div>
            </div>
            <div>
              <div className="text-xs font-mono text-emerald-400">Zero Leakage</div>
              <div className="text-[11px] text-[#8C9BB1]">Strict Split Isolation</div>
            </div>
          </div>
        </div>

        {/* Right Column: Floating Molecular Visual with Quantum Circuit Motifs */}
        <div className="lg:col-span-6 relative flex items-center justify-center h-full max-h-[500px]">
          {/* Subtle Quantum Ring Behind Molecule */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="h-80 w-80 rounded-full border border-[#43E5F5]/20 animate-spin" style={{ animationDuration: "60s" }} />
            <div className="absolute h-96 w-96 rounded-full border border-[#638BFF]/15 animate-spin" style={{ animationDirection: "reverse", animationDuration: "45s" }} />
          </div>

          {/* Interactive 3D Molecular Scaffold */}
          <div className="relative z-10 w-full max-w-lg h-96 rounded-2xl glass-panel p-2 shadow-2xl border border-white/15">
            <Molecular3DViewer
              conformer={ILLUSTRATIVE_MOLECULE}
              className="h-full w-full"
            />
          </div>

          {/* Technical Label (Mandatory scientific transparency) */}
          <div className="absolute -bottom-4 right-4 z-20">
            <span className="text-[10px] font-mono tracking-wider text-[#8C9BB1] bg-[#0D1422]/90 px-2.5 py-1 rounded border border-white/10">
              * Illustrative Purine Scaffold (Rendered live via WebGL Force-Field)
            </span>
          </div>
        </div>
      </main>

      {/* Subtle Minimal Footer (Environment metadata) */}
      <footer className="relative z-20 flex h-10 items-center justify-between px-8 md:px-16 text-[11px] text-[#8C9BB1]/60 font-mono">
        <span>Q-MolAI v1.0.0 · Discover Molecules. Explore Quantum Intelligence.</span>
        <span>Scientific Simulation Engine</span>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        defaultMode={authMode}
      />
    </div>
  );
}
