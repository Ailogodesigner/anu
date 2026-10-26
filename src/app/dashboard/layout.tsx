"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Ticket,
  Bot,
  LayoutTemplate,
  Megaphone,
  Calculator,
  Users,
  Settings,
  ShieldAlert,
  Activity,
  LogOut,
  ChevronRight,
  Shield,
  Server,
  RefreshCw,
  Bell,
  Menu,
  X,
  ExternalLink,
} from "lucide-react";

interface UserProfile {
  id: string;
  discordId: string;
  username: string;
  avatar: string | null;
  role: "ADMIN" | "SUPPORT_LEAD" | "SUPPORT_AGENT" | "VIEWER";
}

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/tickets", label: "Ticket Queue", icon: Ticket },
  { href: "/dashboard/ai", label: "AI & Knowledge Base", icon: Bot },
  { href: "/dashboard/embeds", label: "Embed Builder", icon: LayoutTemplate },
  { href: "/dashboard/announcements", label: "Announcements", icon: Megaphone },
  { href: "/dashboard/calculators", label: "VPS Calculators", icon: Calculator },
  { href: "/dashboard/staff", label: "Staff & Workload", icon: Users },
  { href: "/dashboard/config", label: "Server Config", icon: Settings },
  { href: "/dashboard/audit-logs", label: "Audit & Analytics", icon: ShieldAlert },
  { href: "/dashboard/diagnostics", label: "Diagnostics", icon: Activity },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) throw new Error("Auth request failed");
        return res.json();
      })
      .then((data) => {
        if (data.authenticated && data.user) {
          setUser(data.user);
          setAuthChecking(false);
        } else {
          router.push("/login");
        }
      })
      .catch(() => {
        router.push("/login");
      });
  }, [router]);

  const handleRoleSwitch = async (newRole: "ADMIN" | "SUPPORT_LEAD" | "SUPPORT_AGENT" | "VIEWER") => {
    try {
      const res = await fetch("/api/auth/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        setRoleSwitcherOpen(false);
        router.refresh();
      }
    } catch (err) {
      console.error("Role switch error:", err);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  if (authChecking || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#07090E]">
        <div className="flex flex-col items-center gap-3 text-xs text-muted">
          <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          <span className="font-mono text-muted">Verifying staff console session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-[#0B0F19] select-none">
        {/* Brand */}
        <div className="flex items-center gap-3 px-6 h-16 border-b border-border">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-card border border-border shadow-glow">
            <Server className="w-5 h-5 text-accent" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-foreground flex items-center gap-1.5">
              <span>CAVRIX</span>
              <span className="text-accent text-[11px] font-mono px-1.5 py-0.5 rounded bg-accent/10 border border-accent/20">
                CVRX CLOUD
              </span>
            </div>
            <div className="text-[11px] text-muted">Cloud & Discord Console</div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? "bg-card border border-border text-accent-light shadow-subtle font-semibold"
                    : "text-muted hover:text-foreground hover:bg-card/50"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-accent" : "text-muted"}`} />
                <span>{item.label}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto text-accent" />}
              </Link>
            );
          })}
        </nav>

        {/* Status Card in Sidebar */}
        <div className="p-3 border-t border-border">
          <div className="p-3 rounded-lg bg-card border border-border">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-muted">Gateway Status</span>
              <span className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                ACTIVE
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground flex items-center justify-between">
              <span>Node KVM-FRA01</span>
              <span>10 Gbps</span>
            </div>
          </div>
        </div>

        {/* User Profile Footer */}
        {user && (
          <div className="p-3 border-t border-border bg-[#0B0F19]/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center font-bold text-xs text-accent">
                  {user.username.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-foreground truncate">{user.username}</div>
                  <div className="text-[10px] font-mono text-accent truncate">{user.role}</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                title="Sign out"
                className="p-1.5 rounded-md hover:bg-card text-muted hover:text-danger transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-border bg-card/40 backdrop-blur-md px-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-lg bg-card border border-border text-muted hover:text-foreground"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted">Console</span>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-foreground font-medium">
                {navItems.find((n) => n.href === pathname)?.label || "Dashboard"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Dev Role Switcher */}
            <div className="relative">
              <button
                onClick={() => setRoleSwitcherOpen(!roleSwitcherOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-card border border-border text-xs text-muted hover:text-foreground transition"
              >
                <Shield className="w-3.5 h-3.5 text-accent" />
                <span className="hidden sm:inline">Role:</span>
                <span className="font-mono text-accent-light">{user?.role || "LOADING"}</span>
              </button>

              {roleSwitcherOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-lg bg-[#161F30] border border-border shadow-card p-1.5 z-50 text-xs">
                  <div className="px-2 py-1 text-[10px] uppercase font-bold text-muted border-b border-border mb-1">
                    Simulate Staff Role
                  </div>
                  {(["ADMIN", "SUPPORT_LEAD", "SUPPORT_AGENT", "VIEWER"] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => handleRoleSwitch(r)}
                      className={`w-full text-left px-2.5 py-1.5 rounded text-xs flex items-center justify-between ${
                        user?.role === r ? "bg-accent/10 text-accent font-semibold" : "text-foreground hover:bg-[#1E293B]"
                      }`}
                    >
                      <span>{r}</span>
                      {user?.role === r && <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Live Gateway Indicator */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-muted font-mono text-[11px]">Discord Bot Gateway</span>
            </div>

            <button
              onClick={() => router.refresh()}
              title="Refresh Data"
              className="p-2 rounded-lg bg-card border border-border text-muted hover:text-foreground transition"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
            <div
              className="w-64 h-full bg-[#0B0F19] border-r border-border p-4 flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="font-bold text-sm text-foreground">CAVRIX CLOUD CONSOLE</div>
                <button onClick={() => setMobileOpen(false)} className="p-1 text-muted">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-1 flex-1 overflow-y-auto">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-muted hover:text-foreground hover:bg-card"
                  >
                    <item.icon className="w-4 h-4 text-accent" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Scrollable Page View */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-background">
          <div className="max-w-7xl mx-auto space-y-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
