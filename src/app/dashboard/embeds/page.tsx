"use client";

import React, { useEffect, useState } from "react";
import {
  LayoutTemplate,
  Plus,
  Trash2,
  Save,
  Send,
  CheckCircle2,
  AlertCircle,
  Copy,
  Server,
  Sparkles,
} from "lucide-react";

interface EmbedField {
  name: string;
  value: string;
  inline: boolean;
}

interface EmbedTemplateItem {
  id: string;
  name: string;
  description: string | null;
  title: string | null;
  embedDescription: string | null;
  color: string;
  authorName: string | null;
  footerText: string | null;
  hasTimestamp: boolean;
  fields: string;
}

export default function EmbedBuilderPage() {
  const [templates, setTemplates] = useState<EmbedTemplateItem[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  // Embed State
  const [templateName, setTemplateName] = useState("New Embed Template");
  const [title, setTitle] = useState("🚀 Scheduled Maintenance - Frankfurt DC02");
  const [description, setDescription] = useState(
    "Mandatory hypervisor kernel upgrades and network switch firmware updates will be performed. Expected downtime per VPS is under 5 minutes."
  );
  const [color, setColor] = useState("#06B6D4");
  const [authorName, setAuthorName] = useState("Apex Cloud Infrastructure");
  const [authorIconUrl, setAuthorIconUrl] = useState("");
  const [footerText, setFooterText] = useState("Apex Cloud Operations • 99.99% SLA");
  const [hasTimestamp, setHasTimestamp] = useState(true);
  const [fields, setFields] = useState<EmbedField[]>([
    { name: "Node Range", value: "FRA-HYPER-04 to 09", inline: true },
    { name: "Window", value: "Oct 28, 02:00 UTC", inline: true },
    { name: "Live Status", value: "https://status.apex-vps.internal", inline: false },
  ]);

  // Dispatch state
  const [channelId, setChannelId] = useState("");
  const [dispatching, setDispatching] = useState(false);
  const [dispatchStatus, setDispatchStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/embeds")
      .then((res) => res.json())
      .then((data) => setTemplates(data.templates || []));
  }, []);

  const handleAddField = () => {
    setFields([...fields, { name: "Field Title", value: "Field Value", inline: true }]);
  };

  const handleRemoveField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleFieldChange = (index: number, key: keyof EmbedField, value: any) => {
    const updated = [...fields];
    updated[index] = { ...updated[index], [key]: value };
    setFields(updated);
  };

  const handleLoadTemplate = (id: string) => {
    setSelectedTemplateId(id);
    const found = templates.find((t) => t.id === id);
    if (found) {
      setTemplateName(found.name);
      setTitle(found.title || "");
      setDescription(found.embedDescription || "");
      setColor(found.color || "#06B6D4");
      setAuthorName(found.authorName || "");
      setFooterText(found.footerText || "");
      setHasTimestamp(found.hasTimestamp);
      try {
        setFields(JSON.parse(found.fields) || []);
      } catch {
        setFields([]);
      }
    }
  };

  const handleSaveTemplate = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/embeds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: templateName,
          title,
          embedDescription: description,
          color,
          authorName,
          footerText,
          hasTimestamp,
          fields,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTemplates([...templates, data.template]);
        setSelectedTemplateId(data.template.id);
        alert("Embed template saved successfully!");
      }
    } catch (err) {
      console.error("Save template error:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelId.trim()) return;
    setDispatching(true);
    setDispatchStatus(null);

    try {
      const res = await fetch("/api/embeds/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId,
          title,
          description,
          color,
          authorName,
          footerText,
          hasTimestamp,
          fields,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDispatchStatus({ success: true, message: `Embed dispatched to Discord channel #${channelId}!` });
      } else {
        setDispatchStatus({
          success: false,
          message: data.error || "Failed to dispatch embed. (Ensure bot is connected to server)",
        });
      }
    } catch (err: any) {
      setDispatchStatus({ success: false, message: err.message || "Network error" });
    } finally {
      setDispatching(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <LayoutTemplate className="w-5 h-5 text-accent" />
            <span>Visual Discord Embed Builder</span>
          </h1>
          <p className="text-xs text-muted mt-1">
            Construct enterprise announcement cards with real-time Discord dark UI rendering.
          </p>
        </div>

        {/* Load Template Selector */}
        <div className="flex items-center gap-2">
          <select
            value={selectedTemplateId}
            onChange={(e) => handleLoadTemplate(e.target.value)}
            className="py-2 px-3 rounded-lg bg-card border border-border text-xs text-foreground focus:outline-none focus:border-accent"
          >
            <option value="">Load Saved Template...</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Builder & Preview Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Embed Configuration Controls */}
        <div className="space-y-5">
          <div className="p-5 rounded-xl bg-card border border-border space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-xs font-bold text-foreground font-mono">TEMPLATE & BRANDING</span>
              <button
                type="button"
                onClick={handleSaveTemplate}
                disabled={saving}
                className="px-3 py-1.5 rounded-lg bg-card-secondary border border-border hover:border-accent text-accent text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? "Saving..." : "Save Template"}</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-muted mb-1">Template Name</label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-[#0B0F19] border border-border text-foreground focus:outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted mb-1">Author Name</label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="e.g. Apex VPS Support"
                    className="w-full p-2.5 rounded-lg bg-[#0B0F19] border border-border text-foreground focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-muted mb-1">Accent Strip Color (Hex)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-8 h-8 rounded border-0 bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-full p-2.5 rounded-lg bg-[#0B0F19] border border-border text-foreground font-mono focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-muted mb-1">Embed Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-[#0B0F19] border border-border text-foreground focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-muted mb-1">Embed Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-[#0B0F19] border border-border text-foreground focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-muted mb-1">Footer Text</label>
                <input
                  type="text"
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-[#0B0F19] border border-border text-foreground focus:outline-none focus:border-accent"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="ts"
                  checked={hasTimestamp}
                  onChange={(e) => setHasTimestamp(e.target.checked)}
                  className="accent-accent"
                />
                <label htmlFor="ts" className="text-muted cursor-pointer">
                  Include Current Timestamp in Footer
                </label>
              </div>
            </div>
          </div>

          {/* Dynamic Fields Section */}
          <div className="p-5 rounded-xl bg-card border border-border space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-xs font-bold text-foreground font-mono">EMBED FIELDS ({fields.length})</span>
              <button
                type="button"
                onClick={handleAddField}
                className="px-2.5 py-1 rounded bg-accent/10 border border-accent/20 hover:bg-accent/20 text-accent text-xs font-medium flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Field</span>
              </button>
            </div>

            <div className="space-y-3">
              {fields.map((f, i) => (
                <div key={i} className="p-3 rounded-lg bg-[#0B0F19] border border-border space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-muted text-[10px]">Field #{i + 1}</span>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1 text-muted text-[11px] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={f.inline}
                          onChange={(e) => handleFieldChange(i, "inline", e.target.checked)}
                          className="accent-accent"
                        />
                        <span>Inline</span>
                      </label>
                      <button
                        onClick={() => handleRemoveField(i)}
                        className="text-muted hover:text-danger p-0.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Field Name"
                      value={f.name}
                      onChange={(e) => handleFieldChange(i, "name", e.target.value)}
                      className="p-2 rounded bg-card border border-border text-foreground focus:outline-none focus:border-accent"
                    />
                    <input
                      type="text"
                      placeholder="Field Value"
                      value={f.value}
                      onChange={(e) => handleFieldChange(i, "value", e.target.value)}
                      className="p-2 rounded bg-card border border-border text-foreground focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dispatch to Channel Form */}
          <form onSubmit={handleDispatch} className="p-5 rounded-xl bg-card border border-border space-y-3">
            <div className="text-xs font-bold text-foreground font-mono">DISPATCH TO DISCORD CHANNEL</div>
            <div className="flex gap-2">
              <input
                type="text"
                required
                placeholder="Discord Channel ID (e.g. 123456789012345678)"
                value={channelId}
                onChange={(e) => setChannelId(e.target.value)}
                className="flex-1 p-2.5 rounded-lg bg-[#0B0F19] border border-border text-xs text-foreground focus:outline-none focus:border-accent font-mono"
              />
              <button
                type="submit"
                disabled={dispatching}
                className="px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-black font-semibold text-xs flex items-center gap-1.5 transition shadow-glow disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{dispatching ? "Sending..." : "Dispatch"}</span>
              </button>
            </div>

            {dispatchStatus && (
              <div
                className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                  dispatchStatus.success
                    ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                    : "bg-danger/10 border border-danger/30 text-danger"
                }`}
              >
                {dispatchStatus.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{dispatchStatus.message}</span>
              </div>
            )}
          </form>
        </div>

        {/* Right: Live Discord Preview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-muted">
            <span className="font-mono uppercase font-bold">DISCORD CLIENT PREVIEW</span>
            <span>Channel #announcements</span>
          </div>

          {/* Discord Message Shell */}
          <div className="p-6 rounded-xl bg-[#313338] border border-slate-700 font-sans shadow-card">
            {/* Discord Bot Message Header */}
            <div className="flex items-start gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-[#5865F2] flex items-center justify-center font-bold text-white text-sm">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white text-sm">Apex Support Bot</span>
                  <span className="bg-[#5865F2] text-white text-[10px] font-bold px-1.5 py-0.2 rounded">BOT</span>
                  <span className="text-[11px] text-[#949BA4]">Today at 12:00 PM</span>
                </div>
              </div>
            </div>

            {/* The Embed Card */}
            <div
              className="ml-13 bg-[#2B2D31] rounded-lg p-4 max-w-lg border-l-4 transition-all"
              style={{ borderLeftColor: color }}
            >
              {authorName && (
                <div className="text-xs font-semibold text-[#DBDEE1] mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-accent" />
                  <span>{authorName}</span>
                </div>
              )}

              {title && <div className="text-sm font-bold text-white mb-2">{title}</div>}

              {description && (
                <div className="text-xs text-[#DBDEE1] mb-3 leading-relaxed whitespace-pre-wrap">{description}</div>
              )}

              {fields.length > 0 && (
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {fields.map((f, idx) => (
                    <div key={idx} className={f.inline ? "col-span-1" : "col-span-2"}>
                      <div className="text-[11px] font-semibold text-[#949BA4]">{f.name}</div>
                      <div className="text-xs text-[#DBDEE1] font-mono mt-0.5">{f.value}</div>
                    </div>
                  ))}
                </div>
              )}

              {(footerText || hasTimestamp) && (
                <div className="pt-2 border-t border-[#383A40] flex items-center gap-2 text-[10px] text-[#949BA4]">
                  {footerText && <span>{footerText}</span>}
                  {footerText && hasTimestamp && <span>&bull;</span>}
                  {hasTimestamp && <span>Today at 12:00 PM UTC</span>}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
