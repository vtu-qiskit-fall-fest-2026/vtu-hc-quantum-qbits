"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { X, Lock, Mail, User as UserIcon, AlertCircle, ArrowRight, Sparkles } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: "login" | "register";
}

export default function AuthModal({ isOpen, onClose, defaultMode = "login" }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register" | "reset">(defaultMode);

  React.useEffect(() => {
    setMode(defaultMode);
  }, [defaultMode]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { login, register } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setSubmitting(true);

    try {
      if (mode === "login") {
        await login(email, password);
        onClose();
      } else if (mode === "register") {
        await register(email, password, fullName);
        onClose();
      } else if (mode === "reset") {
        const res = await fetch("http://localhost:8000/api/v1/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, new_password: password }),
        });
        const data = await res.json();
        setSuccessMsg(data.message || "Password updated successfully. Please login.");
        setMode("login");
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0D1422] p-8 shadow-2xl shadow-cyan-500/10">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#8C9BB1] hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#43E5F5] to-[#638BFF] text-[#070B14]">
            <Sparkles size={20} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            {mode === "login" && "Sign In to Q-MolAI"}
            {mode === "register" && "Create Research Account"}
            {mode === "reset" && "Reset Password"}
          </h2>
          <p className="mt-1 text-xs text-[#8C9BB1]">
            {mode === "login" && "Access your molecular datasets and quantum experiments"}
            {mode === "register" && "Join the hybrid quantum-classical chemistry platform"}
            {mode === "reset" && "Enter your email and new password to recover access"}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400">
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div>
              <label className="block text-xs font-medium text-[#8C9BB1] mb-1">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8C9BB1]">
                  <UserIcon size={16} />
                </div>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Dr. Rosalind Franklin"
                  className="w-full rounded-lg border border-white/10 bg-[#111B2B] pl-10 pr-3 py-2 text-sm text-white placeholder-[#8C9BB1]/50 focus:border-[#43E5F5] focus:outline-none focus:ring-1 focus:ring-[#43E5F5]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#8C9BB1] mb-1">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8C9BB1]">
                <Mail size={16} />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="fellow@institute.edu"
                className="w-full rounded-lg border border-white/10 bg-[#111B2B] pl-10 pr-3 py-2 text-sm text-white placeholder-[#8C9BB1]/50 focus:border-[#43E5F5] focus:outline-none focus:ring-1 focus:ring-[#43E5F5]"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-[#8C9BB1]">
                {mode === "reset" ? "New Password" : "Password"}
              </label>
              {mode === "login" && (
                <button
                  type="button"
                  onClick={() => setMode("reset")}
                  className="text-[11px] text-[#43E5F5] hover:underline"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8C9BB1]">
                <Lock size={16} />
              </div>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-lg border border-white/10 bg-[#111B2B] pl-10 pr-3 py-2 text-sm text-white placeholder-[#8C9BB1]/50 focus:border-[#43E5F5] focus:outline-none focus:ring-1 focus:ring-[#43E5F5]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#43E5F5] to-[#638BFF] py-2.5 text-sm font-semibold text-[#070B14] hover:opacity-95 transition-all shadow-md shadow-[#43E5F5]/20 disabled:opacity-50"
          >
            {submitting ? (
              <span className="inline-block h-4 w-4 border-2 border-[#070B14] border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>
                  {mode === "login" && "Sign In"}
                  {mode === "register" && "Create Account"}
                  {mode === "reset" && "Update Password"}
                </span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Footer Mode Switcher */}
        <div className="mt-6 text-center text-xs text-[#8C9BB1]">
          {mode === "login" ? (
            <p>
              Don't have an account?{" "}
              <button
                onClick={() => setMode("register")}
                className="text-[#43E5F5] font-medium hover:underline"
              >
                Sign up
              </button>
            </p>
          ) : (
            <p>
              Already registered?{" "}
              <button
                onClick={() => setMode("login")}
                className="text-[#43E5F5] font-medium hover:underline"
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
