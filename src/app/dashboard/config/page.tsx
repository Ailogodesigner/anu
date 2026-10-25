"use client";

import React, { useEffect, useState } from "react";
import {
  Settings,
  Server,
  Hash,
  Shield,
  Layers,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus,
  Trash2,
} from "lucide-react";

interface GuildConfigData {
  guildId: string;
  guildName: string;
  ticketCategoryId: string | null;
  transcriptChannelId: string | null;
  auditLogChannelId: string | null;
  announcementChannelId: string | null;
  adminRoleId: string | null;
  supportRoleId: string | null;
  escalationRoleId: string | null;
  maxTicketsPerUser: number;
  autoCloseHours: number;
  enableAiSupport: boolean;
  aiEscalationSensitivity: string;
}

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  emoji: string | null;
  defaultPriority: string;
}

export default function ServerConfigPage() {
  const [config, setConfig] = useState<GuildConfigData | null>(null);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/config");
      const data = await res.json();
      setConfig(data.guildConfig);
      setCategories(data.categories || []);
    } catch (err) {
      console.error("Config fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    setSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Save config error:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !config) {
    return (
      <div className="p-8 text-center text-xs text-muted flex items-center justify-center gap-2">
        <RefreshCw className="w-4 h-4 animate-spin text-accent" />
        <span>Loading server configuration...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Settings className="w-5 h-5 text-accent" />
            <span>Server Channels, Categories & Guardrails</span>
          </h1>
          <p className="text-xs text-muted mt-1">
            Configure Discord Gateway routing IDs, support role mappings, and customer ticket rate limits.
          </p>
        </div>

        {saveSuccess && (
          <span className="text-xs text-emerald-400 flex items-center gap-1 font-mono">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Server Settings Saved</span>
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Discord Channels Routing */}
        <div className="p-6 rounded-xl bg-card border border-border space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Hash className="w-4 h-4 text-accent" />
            <span className="text-xs font-bold text-foreground font-mono">DISCORD CHANNEL & CATEGORY ROUTING</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-muted mb-1">Guild / Server Display Name</label>
              <input
                type="text"
                value={config.guildName}
                onChange={(e) => setConfig({ ...config, guildName: e.target.value })}
                className="w-full p-2.5 rounded-lg bg-[#0B0F19] border border-border text-foreground focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-muted mb-1">Target Discord Server ID (Snowflake)</label>
              <input
                type="text"
                value={config.guildId}
                onChange={(e) => setConfig({ ...config, guildId: e.target.value })}
                className="w-full p-2.5 rounded-lg bg-[#0B0F19] border border-border text-foreground font-mono focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-muted mb-1">Active Ticket Category ID (Parent Category)</label>
              <input
                type="text"
                placeholder="Discord Category Snowflake ID"
                value={config.ticketCategoryId || ""}
                onChange={(e) => setConfig({ ...config, ticketCategoryId: e.target.value || null })}
                className="w-full p-2.5 rounded-lg bg-[#0B0F19] border border-border text-foreground font-mono focus:outline-none focus:border-accent"
              />
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                Where dynamic channel per ticket is created
              </span>
            </div>

            <div>
              <label className="block text-muted mb-1">Archived Transcripts Channel ID</label>
              <input
                type="text"
                placeholder="e.g. 990000000000000002"
                value={config.transcriptChannelId || ""}
                onChange={(e) => setConfig({ ...config, transcriptChannelId: e.target.value || null })}
                className="w-full p-2.5 rounded-lg bg-[#0B0F19] border border-border text-foreground font-mono focus:outline-none focus:border-accent"
              />
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                Destination for generated HTML / Markdown ticket transcripts
              </span>
            </div>

            <div>
              <label className="block text-muted mb-1">Audit Log Alerts Channel ID</label>
              <input
                type="text"
                placeholder="e.g. 990000000000000003"
                value={config.auditLogChannelId || ""}
                onChange={(e) => setConfig({ ...config, auditLogChannelId: e.target.value || null })}
                className="w-full p-2.5 rounded-lg bg-[#0B0F19] border border-border text-foreground font-mono focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-muted mb-1">Primary Announcements Channel ID</label>
              <input
                type="text"
                placeholder="e.g. 990000000000000004"
                value={config.announcementChannelId || ""}
                onChange={(e) => setConfig({ ...config, announcementChannelId: e.target.value || null })}
                className="w-full p-2.5 rounded-lg bg-[#0B0F19] border border-border text-foreground font-mono focus:outline-none focus:border-accent"
              />
            </div>
          </div>
        </div>

        {/* Discord Role ID Mappings & Escalation Routing */}
        <div className="p-6 rounded-xl bg-card border border-border space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Shield className="w-4 h-4 text-accent" />
            <span className="text-xs font-bold text-foreground font-mono">DISCORD ROLE PERMISSIONS & ESCALATIONS</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-muted mb-1">Administrator Role ID</label>
              <input
                type="text"
                placeholder="Role Snowflake ID"
                value={config.adminRoleId || ""}
                onChange={(e) => setConfig({ ...config, adminRoleId: e.target.value || null })}
                className="w-full p-2.5 rounded-lg bg-[#0B0F19] border border-border text-foreground font-mono focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-muted mb-1">Support Agent Role ID</label>
              <input
                type="text"
                placeholder="Role Snowflake ID"
                value={config.supportRoleId || ""}
                onChange={(e) => setConfig({ ...config, supportRoleId: e.target.value || null })}
                className="w-full p-2.5 rounded-lg bg-[#0B0F19] border border-border text-foreground font-mono focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-muted mb-1">Staff Escalation Mention Role ID</label>
              <input
                type="text"
                placeholder="Role Snowflake ID"
                value={config.escalationRoleId || ""}
                onChange={(e) => setConfig({ ...config, escalationRoleId: e.target.value || null })}
                className="w-full p-2.5 rounded-lg bg-[#0B0F19] border border-border text-foreground font-mono focus:outline-none focus:border-accent"
              />
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                Mentioned when customer clicks Escalate or AI detects urgency
              </span>
            </div>
          </div>
        </div>

        {/* Support Automation & Rate Limits */}
        <div className="p-6 rounded-xl bg-card border border-border space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Layers className="w-4 h-4 text-accent" />
            <span className="text-xs font-bold text-foreground font-mono">LIMITS & AUTOMATION POLICIES</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-muted mb-1">Max Concurrent Tickets Per User</label>
              <input
                type="number"
                min="1"
                max="10"
                value={config.maxTicketsPerUser}
                onChange={(e) => setConfig({ ...config, maxTicketsPerUser: parseInt(e.target.value) || 3 })}
                className="w-full p-2.5 rounded-lg bg-[#0B0F19] border border-border text-foreground font-mono focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-muted mb-1">Auto-Close Inactivity Timeout (Hours)</label>
              <input
                type="number"
                min="12"
                max="168"
                value={config.autoCloseHours}
                onChange={(e) => setConfig({ ...config, autoCloseHours: parseInt(e.target.value) || 48 })}
                className="w-full p-2.5 rounded-lg bg-[#0B0F19] border border-border text-foreground font-mono focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-muted mb-1">Escalation Trigger Sensitivity</label>
              <select
                value={config.aiEscalationSensitivity}
                onChange={(e) => setConfig({ ...config, aiEscalationSensitivity: e.target.value })}
                className="w-full p-2.5 rounded-lg bg-[#0B0F19] border border-border text-foreground focus:outline-none focus:border-accent"
              >
                <option value="LOW">Low (Allow more AI attempts)</option>
                <option value="NORMAL">Normal (Escalate on 2 failures)</option>
                <option value="HIGH">High (Immediate human handoff)</option>
              </select>
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 text-xs text-muted cursor-pointer">
              <input
                type="checkbox"
                checked={config.enableAiSupport}
                onChange={(e) => setConfig({ ...config, enableAiSupport: e.target.checked })}
                className="accent-accent"
              />
              <span className="text-foreground font-medium">
                Enable AI Support Assistant First-Response in Discord Ticket Channels
              </span>
            </label>
          </div>
        </div>

        {/* Configured Ticket Categories List */}
        <div className="p-6 rounded-xl bg-card border border-border space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <span className="text-xs font-bold text-foreground font-mono">
              ACTIVE TICKET CATEGORIES ({categories.length})
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {categories.map((c) => (
              <div key={c.id} className="p-3.5 rounded-lg bg-[#0B0F19] border border-border space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <span>{c.emoji}</span>
                    <span>{c.name}</span>
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-card text-muted border border-border">
                    {c.defaultPriority}
                  </span>
                </div>
                <p className="text-[11px] text-muted line-clamp-1">{c.description}</p>
                <div className="text-[10px] text-muted-foreground font-mono">slug: {c.slug}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-black font-semibold text-xs flex items-center gap-1.5 transition shadow-glow"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving Server Configuration..." : "Save Server Configuration"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
