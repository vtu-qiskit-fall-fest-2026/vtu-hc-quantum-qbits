"use client";

import React, { useState } from "react";
import Link from "next/navigation";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  LayoutDashboard,
  Atom,
  TrendingUp,
  Cpu,
  GitCompare,
  Binary,
  Database,
  History,
  BookmarkCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  X,
  Sparkles,
  ShieldCheck,
  Activity,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAVIGATION_SECTIONS: NavSection[] = [
  {
    title: "DISCOVER",
    items: [
      { name: "Overview", href: "/dashboard/overview", icon: LayoutDashboard },
      { name: "Molecular Explorer", href: "/dashboard/explorer", icon: Atom },
      { name: "Property Prediction", href: "/dashboard/prediction", icon: TrendingUp },
    ],
  },
  {
    title: "QUANTUM LAB",
    items: [
      { name: "Quantum Experiments", href: "/dashboard/quantum", icon: Cpu },
      { name: "Model Comparison", href: "/dashboard/comparison", icon: GitCompare },
      { name: "Quantum Circuit Studio", href: "/dashboard/circuit-studio", icon: Binary },
    ],
  },
  {
    title: "RESEARCH",
    items: [
      { name: "Dataset Explorer", href: "/dashboard/datasets", icon: Database },
      { name: "Experiment History", href: "/dashboard/history", icon: History },
      { name: "Saved Molecules", href: "/dashboard/saved-molecules", icon: BookmarkCheck },
    ],
  },
  {
    title: "SYSTEM",
    items: [{ name: "Settings", href: "/dashboard/settings", icon: Settings }],
  },
];

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout, loading } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Extract current page title for breadcrumb
  let currentPageTitle = "Overview";
  for (const sec of NAVIGATION_SECTIONS) {
    const found = sec.items.find((i) => i.href === pathname);
    if (found) {
      currentPageTitle = found.name;
      break;
    }
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#070B14] text-[#F2F6FC]">
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Persistent Left Sidebar */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 flex flex-col border-r border-white/10 bg-[#0D1422] transition-all duration-300 ease-in-out ${
          collapsed ? "w-20" : "w-64"
        } ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand / Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-white/10">
          <NextLink href="/dashboard/overview" className="flex items-center gap-3">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#43E5F5] to-[#638BFF] text-[#070B14] shadow-md shadow-[#43E5F5]/20">
              <Atom size={20} className="animate-pulse" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-base font-semibold tracking-wider text-white">Q-MolAI</span>
                <span className="text-[10px] text-[#43E5F5] font-mono tracking-widest uppercase">Quantum Lab</span>
              </div>
            )}
          </NextLink>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-[#111B2B] text-[#8C9BB1] hover:text-white hover:border-[#43E5F5]/40 transition-colors"
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>

          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 text-[#8C9BB1] hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {NAVIGATION_SECTIONS.map((sec) => (
            <div key={sec.title} className="space-y-1">
              {!collapsed && (
                <div className="px-3 pb-1 text-[10px] font-semibold tracking-widest text-[#8C9BB1]/70 uppercase font-mono">
                  {sec.title}
                </div>
              )}
              {sec.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <NextLink
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                      isActive
                        ? "bg-gradient-to-r from-[#111B2B] to-[#142339] text-[#43E5F5] border-l-2 border-[#43E5F5] shadow-sm shadow-[#43E5F5]/10"
                        : "text-[#8C9BB1] hover:bg-[#111B2B]/60 hover:text-[#F2F6FC]"
                    }`}
                    title={collapsed ? item.name : undefined}
                  >
                    <Icon
                      size={18}
                      className={`transition-colors ${
                        isActive ? "text-[#43E5F5]" : "group-hover:text-[#43E5F5]"
                      }`}
                    />
                    {!collapsed && <span>{item.name}</span>}
                  </NextLink>
                );
              })}
            </div>
          ))}
        </div>

        {/* User Footer Profile */}
        <div className="border-t border-white/10 p-3 bg-[#090F1B]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#111B2B] border border-[#43E5F5]/30 text-xs font-semibold text-[#43E5F5]">
                {user?.full_name ? user.full_name[0].toUpperCase() : "Q"}
              </div>
              {!collapsed && (
                <div className="flex flex-col truncate">
                  <span className="text-xs font-medium text-white truncate">
                    {user?.full_name || "Research Fellow"}
                  </span>
                  <span className="text-[10px] text-[#8C9BB1] truncate font-mono">
                    {user?.email || "researcher@qmolai.org"}
                  </span>
                </div>
              )}
            </div>

            {!collapsed && (
              <button
                onClick={logout}
                title="Logout"
                className="p-1.5 rounded text-[#8C9BB1] hover:text-[#FF4F5E] hover:bg-white/5 transition-colors"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 bg-[#070B14]/80 px-6 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-1.5 text-[#8C9BB1] hover:text-white"
            >
              <Menu size={20} />
            </button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-[#8C9BB1]">Q-MolAI</span>
              <span className="text-white/20">/</span>
              <span className="text-[#43E5F5] font-medium">{currentPageTitle}</span>
            </div>
          </div>

          {/* Research Environment Status Indicator */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] text-emerald-400 font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>PennyLane + RDKit: Active</span>
            </div>

            <NextLink
              href="/dashboard/quantum"
              className="flex items-center gap-1.5 rounded-lg border border-[#43E5F5]/40 bg-[#43E5F5]/10 px-3 py-1.5 text-xs font-medium text-[#43E5F5] hover:bg-[#43E5F5]/20 transition-all shadow-sm shadow-[#43E5F5]/10"
            >
              <Sparkles size={14} />
              <span className="hidden sm:inline">New Experiment</span>
            </NextLink>
          </div>
        </header>

        {/* Scrollable Main Workspace */}
        <main className="flex-1 overflow-y-auto px-6 py-8 quantum-grid-bg">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
