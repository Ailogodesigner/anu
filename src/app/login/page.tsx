"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Server, Shield, Lock, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDevLogin = async (role: "ADMIN" | "SUPPORT_LEAD" | "SUPPORT_AGENT") => {
    setLoadingRole(role);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/auth/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, username: `Dev_${role}` }),
      });
      const data = await res.json();
      if (data.success) {
        router.push("/dashboard");
      } else {
        setErrorMsg(data.error || "Failed to authenticate");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Network error");
    } finally {
      setLoadingRole(null);
    }
  };

  const handleDiscordOAuth = () => {
    // Redirect to Discord OAuth endpoint
    window.location.href = "/api/auth/login";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 relative overflow-hidden">
      {/* Background ambient accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-accent/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-card border border-border shadow-glow mb-4">
            <Server className="w-7 h-7 text-accent" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Cavrix Cloud</h1>
          <p className="text-sm text-muted mt-1">Enterprise Bot & Support Management Console</p>
        </div>

        {/* Login Card */}
        <div className="bg-card border border-border rounded-xl shadow-card p-6 md:p-8 space-y-6">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-danger/10 border border-danger/30 text-xs text-danger flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Discord OAuth Login */}
          <div className="space-y-3">
            <button
              onClick={handleDiscordOAuth}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg bg-[#5865F2] hover:bg-[#4752C4] text-white font-medium text-sm transition shadow-subtle group"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07..07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
              <span>Login with Discord Staff Account</span>
              <ArrowRight className="w-4 h-4 ml-auto opacity-70 group-hover:translate-x-0.5 transition" />
            </button>
            <p className="text-[11px] text-muted text-center">
              Requires an authorized staff role on the official Cavrix Cloud Discord server.
            </p>
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-border"></div>
            <span className="flex-shrink mx-4 text-[11px] text-muted uppercase tracking-wider font-mono">
              Development Access Mode
            </span>
            <div className="flex-grow border-t border-border"></div>
          </div>

          {/* Dev Quick Simulation Logins */}
          <div className="space-y-2">
            <div className="text-xs text-muted mb-2">Simulate staff sessions for local development:</div>

            <button
              onClick={() => handleDevLogin("ADMIN")}
              disabled={loadingRole !== null}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-card-secondary border border-border hover:border-accent/40 text-xs text-foreground transition"
            >
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-accent" />
                <span className="font-semibold">Sign in as Administrator</span>
              </div>
              <span className="font-mono text-[10px] text-accent-light px-2 py-0.5 rounded bg-accent/10 border border-accent/20">
                {loadingRole === "ADMIN" ? "Signing In..." : "FULL ACCESS"}
              </span>
            </button>

            <button
              onClick={() => handleDevLogin("SUPPORT_LEAD")}
              disabled={loadingRole !== null}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-card-secondary border border-border hover:border-accent/40 text-xs text-foreground transition"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold">Sign in as Support Lead</span>
              </div>
              <span className="font-mono text-[10px] text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                {loadingRole === "SUPPORT_LEAD" ? "Signing In..." : "ESCALATIONS"}
              </span>
            </button>

            <button
              onClick={() => handleDevLogin("SUPPORT_AGENT")}
              disabled={loadingRole !== null}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-card-secondary border border-border hover:border-accent/40 text-xs text-foreground transition"
            >
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-cyan-400" />
                <span className="font-semibold">Sign in as Support Agent</span>
              </div>
              <span className="font-mono text-[10px] text-cyan-400 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                {loadingRole === "SUPPORT_AGENT" ? "Signing In..." : "TICKETS"}
              </span>
            </button>
          </div>

          <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] text-muted">
            <span>Enterprise SLA Protected</span>
            <span className="font-mono">v1.0.0-PROD</span>
          </div>
        </div>
      </div>
    </div>
  );
}
