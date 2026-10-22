"use client";

import React, { useState } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Atom, Lock, Mail, User as UserIcon, AlertCircle, ArrowRight, Sparkles } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(email, password, fullName);
      router.push("/dashboard/overview");
    } catch (err: any) {
      setError(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-[#070B14] p-4 text-[#F2F6FC]">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0D1422] p-8 shadow-2xl">
        <div className="text-center mb-6">
          <NextLink href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#43E5F5] to-[#638BFF] text-[#070B14]">
              <Atom size={22} className="animate-pulse" />
            </div>
            <span className="text-xl font-bold text-white tracking-wider">Q-MolAI</span>
          </NextLink>
          <h1 className="text-2xl font-bold text-white">Create Research Account</h1>
          <p className="text-xs text-[#8C9BB1] mt-1 font-mono">
            Join the hybrid quantum-classical chemistry platform
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-[#8C9BB1] mb-1">Full Name</label>
            <div className="relative">
              <UserIcon size={16} className="absolute left-3 top-3 text-[#8C9BB1]" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Dr. Rosalind Franklin"
                className="w-full rounded-lg border border-white/10 bg-[#111B2B] pl-10 pr-3 py-2 text-sm text-white focus:border-[#43E5F5] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-[#8C9BB1] mb-1">Email Address</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-3 text-[#8C9BB1]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="scientist@laboratory.edu"
                className="w-full rounded-lg border border-white/10 bg-[#111B2B] pl-10 pr-3 py-2 text-sm text-white focus:border-[#43E5F5] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-[#8C9BB1] mb-1">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-3 text-[#8C9BB1]" />
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full rounded-lg border border-white/10 bg-[#111B2B] pl-10 pr-3 py-2 text-sm text-white focus:border-[#43E5F5] focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#43E5F5] to-[#638BFF] py-2.5 text-sm font-semibold text-[#070B14] hover:opacity-95 shadow-md shadow-[#43E5F5]/20 disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block h-4 w-4 border-2 border-[#070B14] border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Register Account</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-[#8C9BB1]">
          Already registered?{" "}
          <NextLink href="/login" className="text-[#43E5F5] font-medium hover:underline">
            Sign in
          </NextLink>
        </div>
      </div>
    </div>
  );
}
