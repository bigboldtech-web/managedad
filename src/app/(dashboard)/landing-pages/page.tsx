"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Globe, BarChart3, ExternalLink, Trash2, Zap } from "lucide-react";

const S = {
  card: { background: "#111114", border: "1px solid #27272e", borderRadius: "12px" },
  mono: { fontFamily: "var(--font-ibm-plex-mono), monospace" },
};

interface LandingPage {
  id: string;
  name: string;
  slug: string;
  isPublished: boolean;
  visits: number;
  conversions: number;
  createdAt: string;
}

const ACCENT_COLORS = ["#f97316", "#34d399", "#818cf8", "#f472b6", "#38bdf8", "#fbbf24"];

function convRate(p: LandingPage): string {
  if (!p.visits) return "—";
  return `${((p.conversions / p.visits) * 100).toFixed(1)}%`;
}

export default function LandingPagesPage() {
  const [pages, setPages] = useState<LandingPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [pageName, setPageName] = useState("");
  const [publishing, setPublishing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadPages = useCallback(async () => {
    const res = await fetch("/api/landing-pages");
    if (res.ok) {
      const { pages: data } = await res.json();
      setPages(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadPages(); }, [loadPages]);

  async function generatePage() {
    if (!prompt.trim()) return;
    setGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/landing-pages/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, name: pageName }),
      });
      if (!res.ok) {
        const { error: err } = await res.json();
        setError(err || "Generation failed");
        return;
      }
      await loadPages();
      setShowCreate(false);
      setPrompt("");
      setPageName("");
    } catch {
      setError("Network error — please try again");
    } finally {
      setGenerating(false);
    }
  }

  async function togglePublish(id: string, current: boolean) {
    setPublishing(id);
    try {
      await fetch(`/api/landing-pages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !current }),
      });
      setPages((prev) => prev.map((p) => p.id === id ? { ...p, isPublished: !current } : p));
    } finally {
      setPublishing(null);
    }
  }

  async function deletePage(id: string) {
    setDeleting(id);
    try {
      await fetch(`/api/landing-pages/${id}`, { method: "DELETE" });
      setPages((prev) => prev.filter((p) => p.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  const totalVisits = pages.reduce((s, p) => s + p.visits, 0);
  const totalConversions = pages.reduce((s, p) => s + p.conversions, 0);
  const activePagesWithVisits = pages.filter((p) => p.visits > 0);
  const avgConvRate = activePagesWithVisits.length > 0
    ? activePagesWithVisits.reduce((s, p) => s + (p.conversions / p.visits) * 100, 0) / activePagesWithVisits.length
    : 0;

  const appUrl = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontFamily: '"Sora", sans-serif', fontSize: "22px", fontWeight: 800, color: "#fafafa", letterSpacing: "-0.5px", marginBottom: "3px" }}>Landing Pages</h1>
          <p style={{ fontSize: "13px", color: "#52525b" }}>AI-generated pages with dynamic keyword insertion. Hosted on edge.</p>
        </div>
        <button onClick={() => setShowCreate(true)} style={{ display: "flex", alignItems: "center", gap: "7px", padding: "9px 16px", background: "#f97316", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
          <Zap size={13} /> Generate Page
        </button>
      </div>

      {/* Generate modal */}
      {showCreate && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, backdropFilter: "blur(4px)" }}>
          <div style={{ ...S.card, padding: "28px", width: "500px", maxWidth: "90vw" }}>
            <h2 style={{ fontFamily: '"Sora", sans-serif', fontSize: "18px", fontWeight: 800, color: "#fafafa", marginBottom: "6px" }}>Generate Landing Page</h2>
            <p style={{ fontSize: "13px", color: "#52525b", marginBottom: "20px" }}>Describe your page and Claude AI will build it in seconds.</p>

            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>Page Name</label>
              <input
                value={pageName}
                onChange={(e) => setPageName(e.target.value)}
                placeholder="e.g. Gaming Laptops Sale"
                style={{ width: "100%", padding: "9px 12px", background: "#18181c", border: "1px solid #27272e", borderRadius: "7px", color: "#fafafa", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>Describe Your Page</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. A landing page for gaming laptops under ₹80,000, targeting college students. Focus on performance, cooling, and EMI options. Include a free consultation CTA."
                style={{ width: "100%", height: "110px", padding: "12px 14px", background: "#18181c", border: "1px solid #27272e", borderRadius: "8px", color: "#fafafa", fontSize: "13px", resize: "none", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
              />
            </div>

            {error && <div style={{ padding: "8px 12px", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "6px", fontSize: "12.5px", color: "#f87171", marginBottom: "12px" }}>{error}</div>}

            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={generatePage} disabled={generating || !prompt.trim()} style={{ flex: 1, height: "42px", background: generating ? "rgba(249,115,22,0.5)" : "#f97316", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: generating ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                <Zap size={13} /> {generating ? "Generating with Claude…" : "Generate"}
              </button>
              <button onClick={() => { setShowCreate(false); setError(""); }} style={{ padding: "0 20px", height: "42px", background: "transparent", border: "1px solid #27272e", borderRadius: "8px", color: "#71717a", fontSize: "13px", cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
        {[
          { label: "Total Pages", value: loading ? "—" : String(pages.length), sub: `${pages.filter((p) => p.isPublished).length} published` },
          { label: "Total Visits", value: loading ? "—" : totalVisits.toLocaleString("en-IN"), sub: "all time" },
          { label: "Conversions", value: loading ? "—" : String(totalConversions), sub: "form submissions" },
          { label: "Avg. Conv. Rate", value: loading ? "—" : avgConvRate > 0 ? `${avgConvRate.toFixed(2)}%` : "—", sub: "across active pages" },
        ].map(stat => (
          <div key={stat.label} style={{ ...S.card, padding: "16px 18px" }}>
            <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#3f3f46", marginBottom: "6px" }}>{stat.label}</div>
            <div style={{ fontFamily: '"Sora", sans-serif', fontSize: "22px", fontWeight: 800, color: "#fafafa", letterSpacing: "-0.5px", marginBottom: "2px" }}>{stat.value}</div>
            <div style={{ fontSize: "11px", color: "#52525b" }}>{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Pages grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ ...S.card, height: "280px" }} />
          ))
        ) : pages.map((page, idx) => {
          const accent = ACCENT_COLORS[idx % ACCENT_COLORS.length];
          return (
            <div key={page.id} style={{ ...S.card, overflow: "hidden" }}>
              {/* Mini preview */}
              <div style={{ height: "110px", background: "linear-gradient(160deg, #0f172a 0%, #1e1b4b 100%)", padding: "16px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 30% 50%, ${accent}18 0%, transparent 60%)` }} />
                <div style={{ position: "relative" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#fafafa", lineHeight: 1.35, marginBottom: "6px" }}>{page.name}</div>
                  <div style={{ fontSize: "10px", color: "#3f3f46", ...S.mono }}>{appUrl}/lp/{page.slug}</div>
                </div>
                <div style={{ position: "absolute", top: "8px", right: "8px" }}>
                  {page.isPublished ? (
                    <span style={{ padding: "2px 7px", borderRadius: "4px", fontSize: "9px", fontWeight: 700, background: "rgba(52,211,153,0.2)", color: "#34d399" }}>LIVE</span>
                  ) : (
                    <span style={{ padding: "2px 7px", borderRadius: "4px", fontSize: "9px", fontWeight: 700, background: "rgba(113,113,122,0.2)", color: "#71717a" }}>DRAFT</span>
                  )}
                </div>
              </div>

              {/* Page info */}
              <div style={{ padding: "14px 16px" }}>
                <div style={{ fontSize: "11px", color: "#3f3f46", marginBottom: "12px" }}>
                  Created {new Date(page.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginBottom: "14px" }}>
                  {[
                    { label: "Visits", value: page.visits.toLocaleString("en-IN") },
                    { label: "Conv.", value: String(page.conversions) },
                    { label: "Rate", value: convRate(page) },
                  ].map(m => (
                    <div key={m.label} style={{ background: "#0d0d10", borderRadius: "6px", padding: "7px 9px", textAlign: "center" }}>
                      <div style={{ fontSize: "9.5px", color: "#3f3f46", marginBottom: "3px" }}>{m.label}</div>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "#fafafa", ...S.mono }}>{m.value}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    onClick={() => togglePublish(page.id, page.isPublished)}
                    disabled={publishing === page.id}
                    style={{ flex: 1, height: "32px", background: page.isPublished ? "rgba(248,113,113,0.08)" : "rgba(52,211,153,0.08)", border: `1px solid ${page.isPublished ? "rgba(248,113,113,0.2)" : "rgba(52,211,153,0.2)"}`, borderRadius: "6px", color: page.isPublished ? "#f87171" : "#34d399", fontSize: "11.5px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}>
                    <Globe size={11} /> {publishing === page.id ? "…" : page.isPublished ? "Unpublish" : "Publish"}
                  </button>
                  {page.isPublished && (
                    <a href={`${appUrl}/lp/${page.slug}`} target="_blank" rel="noopener noreferrer" style={{ height: "32px", width: "32px", background: "transparent", border: "1px solid #27272e", borderRadius: "6px", color: "#71717a", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
                      <ExternalLink size={11} />
                    </a>
                  )}
                  <button
                    onClick={() => { if (confirm(`Delete "${page.name}"?`)) deletePage(page.id); }}
                    disabled={deleting === page.id}
                    style={{ height: "32px", width: "32px", background: "transparent", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "6px", color: "#f87171", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {deleting === page.id ? <BarChart3 size={11} /> : <Trash2 size={11} />}
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Add new card */}
        {!loading && (
          <div onClick={() => setShowCreate(true)} style={{ ...S.card, border: "1px dashed #27272e", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "240px", cursor: "pointer", gap: "10px", transition: "border-color 0.2s, background 0.2s" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(249,115,22,0.4)"; (e.currentTarget as HTMLElement).style.background = "rgba(249,115,22,0.03)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#27272e"; (e.currentTarget as HTMLElement).style.background = "#111114"; }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(249,115,22,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Plus size={18} color="#f97316" />
            </div>
            <div style={{ fontSize: "13px", fontWeight: 500, color: "#52525b" }}>Generate new page</div>
          </div>
        )}
      </div>
    </div>
  );
}
