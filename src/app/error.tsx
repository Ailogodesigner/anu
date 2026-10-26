"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, Home, LogIn } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application root error caught by error boundary:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#07090E] text-[#F3F4F6] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-[#0F131D] border border-[#1F2937] rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold tracking-tight text-white">Application Exception</h1>
          <p className="text-xs text-slate-400">
            A client-side state or network exception occurred while loading the application interface.
          </p>
        </div>

        {error?.message && (
          <div className="p-3 rounded-lg bg-black/40 border border-[#1F2937] text-left text-[11px] font-mono text-rose-300 break-words max-h-32 overflow-y-auto">
            {error.message}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => reset()}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>

          <Link
            href="/login"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#161F30] hover:bg-[#1E293B] border border-[#1F2937] text-white text-xs font-medium transition"
          >
            <LogIn className="w-3.5 h-3.5 text-cyan-400" />
            <span>Go to Login</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
