"use client";

import React, { useEffect, useState } from "react";
import {
  Bot,
  BookOpen,
  Sliders,
  Shield,
  Play,
  Save,
  Plus,
  Trash2,
  Edit,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
} from "lucide-react";

interface AiConfigData {
  id: string;
  provider: string;
  modelName: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  guardrailsEnabled: boolean;
  autoTroubleshootSsh: boolean;
  autoTroubleshootFirewall: boolean;
  autoTroubleshootResources: boolean;
  monthlyTokenLimit: number;
  tokensUsedThisMonth: number;
  fallbackEnabled: boolean;
}

interface KbArticle {
  id: string;
  title: string;
  slug: string;
  category: string;
  content: string;
  keywords: string;
  isPublished: boolean;
  usageCount: number;
  helpfulCount: number;
}

export default function AiKnowledgeBasePage() {
  const [activeTab, setActiveTab] = useState<"config" | "kb">("config");
  const [config, setConfig] = useState<AiConfigData | null>(null);
  const [articles, setArticles] = useState<KbArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sandbox testing state
  const [testQuery, setTestQuery] = useState("My VPS says 'Connection refused' on port 22. What should I check?");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  // Article Modal
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [artTitle, setArtTitle] = useState("");
  const [artSlug, setArtSlug] = useState("");
  const [artCategory, setArtCategory] = useState("SSH");
  const [artContent, setArtContent] = useState("");
  const [artKeywords, setArtKeywords] = useState("");
  const [kbSearch, setKbSearch] = useState("");

  const fetchData = async () => {
    try {
      const [cfgRes, kbRes] = await Promise.all([
        fetch("/api/ai/config").then((r) => r.json()),
        fetch("/api/ai/kb").then((r) => r.json()),
      ]);
      setConfig(cfgRes.config);
      setArticles(kbRes.articles || []);
    } catch (err) {
      console.error("Error loading AI settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch("/api/ai/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Error updating config:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleRunTest = async () => {
    if (!testQuery.trim()) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/ai/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: testQuery }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err) {
      console.error("Test error:", err);
    } finally {
      setTesting(false);
    }
  };

  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingArticleId) {
        await fetch(`/api/ai/kb/${editingArticleId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: artTitle,
            slug: artSlug,
            category: artCategory,
            content: artContent,
            keywords: artKeywords,
          }),
        });
      } else {
        await fetch("/api/ai/kb", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: artTitle,
            slug: artSlug,
            category: artCategory,
            content: artContent,
            keywords: artKeywords,
          }),
        });
      }
      setShowArticleModal(false);
      resetArticleForm();
      fetchData();
    } catch (err) {
      console.error("Save article error:", err);
    }
  };

  const handleDeleteArticle = async (id: string) => {
    if (!confirm("Are you sure you want to remove this documentation article?")) return;
    try {
      await fetch(`/api/ai/kb/${id}`, { method: "DELETE" });
      fetchData();
    } catch (err) {
      console.error("Delete article error:", err);
    }
  };

  const resetArticleForm = () => {
    setEditingArticleId(null);
    setArtTitle("");
    setArtSlug("");
    setArtCategory("SSH");
    setArtContent("");
    setArtKeywords("");
  };

  const handleEditClick = (art: KbArticle) => {
    setEditingArticleId(art.id);
    setArtTitle(art.title);
    setArtSlug(art.slug);
    setArtCategory(art.category);
    setArtContent(art.content);
    setArtKeywords(art.keywords);
    setShowArticleModal(true);
  };

  if (loading || !config) {
    return (
      <div className="p-8 text-center text-xs text-muted flex items-center justify-center gap-2">
        <RefreshCw className="w-4 h-4 animate-spin text-accent" />
        <span>Loading AI Assistant and Knowledge Base...</span>
      </div>
    );
  }

  const filteredArticles = articles.filter(
    (a) =>
      a.title.toLowerCase().includes(kbSearch.toLowerCase()) ||
      a.keywords.toLowerCase().includes(kbSearch.toLowerCase()) ||
      a.category.toLowerCase().includes(kbSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Bot className="w-5 h-5 text-accent" />
            <span>AI Technical Support & Knowledge Base</span>
          </h1>
          <p className="text-xs text-muted mt-1">
            Configure provider orchestration, non-hallucination guardrails, and approved VPS troubleshooting docs.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-card border border-border">
          <button
            onClick={() => setActiveTab("config")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition ${
              activeTab === "config" ? "bg-accent/15 text-accent font-semibold" : "text-muted hover:text-foreground"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>AI Configuration</span>
          </button>
          <button
            onClick={() => setActiveTab("kb")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition ${
              activeTab === "kb" ? "bg-accent/15 text-accent font-semibold" : "text-muted hover:text-foreground"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Knowledge Base ({articles.length})</span>
          </button>
        </div>
      </div>

      {activeTab === "config" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Config Form (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSaveConfig} className="p-6 rounded-xl bg-card border border-border space-y-6">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Shield className="w-4 h-4 text-accent" />
                  <span>Model Orchestration & Limits</span>
                </h2>
                {saveSuccess && (
                  <span className="text-xs text-emerald-400 flex items-center gap-1 font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Configuration Saved</span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Provider Selector */}
                <div>
                  <label className="block text-muted mb-1 font-medium">Provider Service</label>
                  <select
                    value={config.provider}
                    onChange={(e) => setConfig({ ...config, provider: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-[#0B0F19] border border-border text-foreground focus:outline-none focus:border-accent"
                  >
                    <option value="LOCAL_FALLBACK">Rule Engine (Zero API Key Required)</option>
                    <option value="GEMINI">Google Gemini 1.5 Flash</option>
                    <option value="OPENAI">OpenAI GPT-4o-mini</option>
                    <option value="ANTHROPIC">Anthropic Claude 3.5 Haiku</option>
                  </select>
                </div>

                {/* Model Identifier */}
                <div>
                  <label className="block text-muted mb-1 font-medium">Model Identifier</label>
                  <input
                    type="text"
                    value={config.modelName}
                    onChange={(e) => setConfig({ ...config, modelName: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-[#0B0F19] border border-border text-foreground focus:outline-none focus:border-accent"
                  />
                </div>

                {/* Temperature Slider */}
                <div>
                  <div className="flex items-center justify-between text-muted mb-1">
                    <label className="font-medium">Temperature (Creativity vs Determinism)</label>
                    <span className="font-mono text-accent">{config.temperature}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={config.temperature}
                    onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
                    className="w-full accent-accent"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                    <span>Precise (0.0)</span>
                    <span>Balanced (0.2)</span>
                    <span>Creative (1.0)</span>
                  </div>
                </div>

                {/* Monthly Token Limit */}
                <div>
                  <label className="block text-muted mb-1 font-medium">Monthly Token Budget</label>
                  <input
                    type="number"
                    value={config.monthlyTokenLimit}
                    onChange={(e) => setConfig({ ...config, monthlyTokenLimit: parseInt(e.target.value) || 100000 })}
                    className="w-full p-2.5 rounded-lg bg-[#0B0F19] border border-border text-foreground focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              {/* System Prompt Editor */}
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Base System Instructions & Persona</label>
                <textarea
                  rows={6}
                  value={config.systemPrompt}
                  onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
                  className="w-full p-3 rounded-lg bg-[#0B0F19] border border-border text-xs text-foreground font-mono focus:outline-none focus:border-accent"
                />
              </div>

              {/* Guardrails Checkboxes */}
              <div className="p-4 rounded-lg bg-[#0B0F19] border border-border space-y-3">
                <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-accent" />
                  <span>Security & Anti-Hallucination Guardrails</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-muted">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.guardrailsEnabled}
                      onChange={(e) => setConfig({ ...config, guardrailsEnabled: e.target.checked })}
                      className="accent-accent"
                    />
                    <span>Enforce credential privacy (Never ask passwords)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.autoTroubleshootSsh}
                      onChange={(e) => setConfig({ ...config, autoTroubleshootSsh: e.target.checked })}
                      className="accent-accent"
                    />
                    <span>Auto-troubleshoot SSH port 22 refusals</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.autoTroubleshootFirewall}
                      onChange={(e) => setConfig({ ...config, autoTroubleshootFirewall: e.target.checked })}
                      className="accent-accent"
                    />
                    <span>Inspect UFW / IPTables firewall lockout</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.fallbackEnabled}
                      onChange={(e) => setConfig({ ...config, fallbackEnabled: e.target.checked })}
                      className="accent-accent"
                    />
                    <span>Fallback to local rule engine if provider fails</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-black font-semibold text-xs flex items-center gap-1.5 transition shadow-glow"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? "Saving Changes..." : "Save AI Configuration"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Sandbox Live Tester (1 col) */}
          <div className="space-y-4">
            <div className="p-5 rounded-xl bg-card border border-border space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5 text-accent" />
                  <span>Diagnostic Sandbox Simulator</span>
                </h3>
                <span className="text-[10px] text-muted font-mono">Live Test</span>
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] text-muted">Simulated Customer Query</label>
                <textarea
                  rows={3}
                  value={testQuery}
                  onChange={(e) => setTestQuery(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-[#0B0F19] border border-border text-xs text-foreground focus:outline-none focus:border-accent"
                />
                <button
                  onClick={handleRunTest}
                  disabled={testing}
                  className="w-full py-2 rounded-lg bg-card-secondary border border-border hover:border-accent text-foreground text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <Play className="w-3 h-3 text-accent" />
                  <span>{testing ? "Simulating Diagnostic..." : "Run AI Test Sandbox"}</span>
                </button>
              </div>

              {testResult && (
                <div className="p-3.5 rounded-lg bg-[#0B0F19] border border-border space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-accent">Provider: {testResult.usedProvider}</span>
                    {testResult.shouldEscalate ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-warning/15 text-warning border border-warning/30">
                        ESCALATE TO HUMAN
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono text-emerald-400">
                        RESOLVED VIA KB
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] text-[#E2E8F0] whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                    {testResult.reply}
                  </div>

                  {testResult.sourceArticles?.length > 0 && (
                    <div className="pt-2 border-t border-border">
                      <div className="text-[10px] text-muted mb-1">Referenced Knowledge Base Articles:</div>
                      <div className="flex flex-wrap gap-1">
                        {testResult.sourceArticles.map((a: any) => (
                          <span key={a.id} className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent/10 text-accent">
                            {a.title}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Knowledge Base Articles Tab */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="Search articles by title or keyword..."
                value={kbSearch}
                onChange={(e) => setKbSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg bg-card border border-border text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
              />
            </div>

            <button
              onClick={() => {
                resetArticleForm();
                setShowArticleModal(true);
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-accent hover:bg-accent-hover text-black font-semibold text-xs transition shadow-glow self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Create Documentation</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredArticles.map((art) => (
              <div
                key={art.id}
                className="p-5 rounded-xl bg-card border border-border shadow-subtle hover:border-accent/40 transition flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-accent/15 text-accent border border-accent/20">
                      {art.category}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {art.usageCount} lookups &bull; {art.helpfulCount} helpful
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-foreground">{art.title}</h3>
                  <p className="text-xs text-muted line-clamp-3 leading-relaxed">{art.content}</p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[140px]">
                    slug: /{art.slug}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleEditClick(art)}
                      className="p-1.5 rounded hover:bg-card-secondary text-muted hover:text-accent transition"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteArticle(art.id)}
                      className="p-1.5 rounded hover:bg-card-secondary text-muted hover:text-danger transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Article Modal */}
      {showArticleModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#161F30] border border-border rounded-xl shadow-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-sm text-foreground">
                {editingArticleId ? "Edit Knowledge Base Article" : "Create Approved Knowledge Base Article"}
              </h3>
              <button onClick={() => setShowArticleModal(false)} className="text-muted hover:text-foreground text-xs">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveArticle} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted mb-1">Article Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Diagnosing Out-Of-Memory (OOM) Crashes"
                    value={artTitle}
                    onChange={(e) => {
                      setArtTitle(e.target.value);
                      if (!editingArticleId) {
                        setArtSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
                      }
                    }}
                    className="w-full p-2.5 rounded-lg bg-[#0B0F19] border border-border text-foreground focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-muted mb-1">Slug Identifier</label>
                  <input
                    type="text"
                    required
                    value={artSlug}
                    onChange={(e) => setArtSlug(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-[#0B0F19] border border-border text-foreground focus:outline-none focus:border-accent font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted mb-1">Category</label>
                  <select
                    value={artCategory}
                    onChange={(e) => setArtCategory(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-[#0B0F19] border border-border text-foreground focus:outline-none focus:border-accent"
                  >
                    <option value="SSH">SSH Access & Authentication</option>
                    <option value="FIREWALL">UFW & IPTables Firewall</option>
                    <option value="RESOURCES">Resource Limits & OOM</option>
                    <option value="VPS_CONNECTIVITY">VPS Connectivity & Latency</option>
                    <option value="GENERAL">General Hosting FAQs</option>
                  </select>
                </div>
                <div>
                  <label className="block text-muted mb-1">Search Keywords (Space-separated)</label>
                  <input
                    type="text"
                    placeholder="ssh port 22 connection refused timeout fail2ban"
                    value={artKeywords}
                    onChange={(e) => setArtKeywords(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-[#0B0F19] border border-border text-foreground focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-muted mb-1">Markdown Documentation Content</label>
                <textarea
                  rows={8}
                  required
                  placeholder="### Problem&#10;Describe root cause and diagnostic commands..."
                  value={artContent}
                  onChange={(e) => setArtContent(e.target.value)}
                  className="w-full p-3 rounded-lg bg-[#0B0F19] border border-border text-foreground font-mono focus:outline-none focus:border-accent"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowArticleModal(false)}
                  className="px-3 py-2 rounded-lg bg-card-secondary text-muted hover:text-foreground text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-black font-semibold text-xs transition shadow-glow"
                >
                  Save Article
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
