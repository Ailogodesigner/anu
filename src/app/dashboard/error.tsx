"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, LayoutDashboard, LogIn } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error caught by dashboard error boundary:", error);
  }, [error]);

  return (
    <div className="p-8 max-w-lg mx-auto bg-card border border-border rounded-2xl shadow-card space-y-6 text-center my-12">
      <div className="w-12 h-12 rounded-xl bg-warning/10 border border-warning/20 text-warning flex items-center justify-center mx-auto">
        <AlertTriangle className="w-6 h-6" />
      </div>

      <div className="space-y-1.5">
        <h2 className="text-lg font-bold tracking-tight text-foreground">Console View Exception</h2>
        <p className="text-xs text-muted">
          Failed to render this dashboard view. Your session credentials or network response may have expired.
        </p>
      </div>

      {error?.message && (
        <div className="p-3 rounded-lg bg-[#0B0F19] border border-border text-left text-[11px] font-mono text-warning break-words max-h-32 overflow-y-auto">
          {error.message}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <button
          onClick={() => reset()}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-accent hover:bg-accent-hover text-black font-semibold text-xs transition shadow-glow"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reload View</span>
        </button>

        <Link
          href="/dashboard"
          className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-card-secondary border border-border hover:border-accent/40 text-foreground text-xs font-medium transition"
        >
          <LayoutDashboard className="w-3.5 h-3.5 text-accent" />
          <span>Console Home</span>
        </Link>
      </div>
    </div>
  );
}
