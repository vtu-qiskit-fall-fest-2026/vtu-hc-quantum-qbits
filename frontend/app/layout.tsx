import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

export const metadata: Metadata = {
  title: "Q-MolAI — Discover Molecules. Explore Quantum Intelligence.",
  description:
    "Hybrid quantum-classical SaaS platform for molecular property prediction, RDKit descriptor calculation, and PennyLane quantum kernel learning.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full bg-[#070B14] text-[#F2F6FC]">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
