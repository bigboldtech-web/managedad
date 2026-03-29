"use client";

import { useState, useEffect } from "react";
import { Search, Plus, TrendingUp, TrendingDown, AlertCircle, Sparkles, X, Check, Loader2, CheckSquare, Square } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { NegativeSuggestion } from "@/app/api/keywords/mine-negatives/route";

const S = {
  card: { background: "#111114", border: "1px solid #27272e", borderRadius: "12px" },
  mono: { fontFamily: "var(--font-ibm-plex-mono), monospace" },
  th: { padding: "10px 14px", fontSize: "10px", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1px", color: "#3f3f46", borderBottom: "1px solid #27272e" },
};

interface Keyword {
  id: string; text: string; matchType: string; campaign: string; status: string;
  impressions: number; clicks: number; spend: number; conversions: number;
  cpa: number; cpc: number; qualityScore: number; trend: string;
}
interface Negative {
  text: string; matchType: string; addedBy: string; addedAt: string; savings: string;
}

const matchTypeColor: Record<string, { bg: string; color: string }> = {
  EXACT: { bg: "rgba(52,211,153,0.08)", color: "#34d399" },
  PHRASE: { bg: "rgba(251,191,36,0.08)", color: "#fbbf24" },
  BROAD: { bg: "rgba(113,113,122,0.1)", color: "#71717a" },
};

export default function KeywordsPage() {
  const [tab, setTab] = useState<"active" | "negatives">("active");
  const [search, setSearch] = useState("");
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [negatives, setNegatives] = useState<Negative[]>([]);

  useEffect(() => {
    async function fetchKeywords() {
      try {
        const res = await fetch("/api/keywords");
        if (res.ok) {
          const data = await res.json();
          setKeywords(data.keywords ?? []);
          setNegatives(data.negatives ?? []);
        }
      } catch {}
    }
    fetchKeywords();
  }, []);

  // Mining state
  const [miningOpen, setMiningOpen] = useState(false);
  const [miningLoading, setMiningLoading] = useState(false);
  const [miningError, setMiningError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<NegativeSuggestion[]>([]);
  const [miningTotal, setMiningTotal] = useState(0);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [applying, setApplying] = useState(false);
  const [applyResult, setApplyResult] = useState<{ applied: number; failed: number } | null>(null);

  const filtered = keywords.filter(k => k.text.toLowerCase().includes(search.toLowerCase()));
  const issues = keywords.filter(k => k.qualityScore < 5 || (k.conversions === 0 && k.spend > 5000));

  async function handleMineNegatives() {
    setMiningOpen(true);
    setMiningLoading(true);
    setMiningError(null);
    setSuggestions([]);
    setSelected(new Set());
    setApplyResult(null);

    try {
      const res = await fetch("/api/keywords/mine-negatives");
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Failed to mine negatives");

      setSuggestions(data.suggestions ?? []);
      setMiningTotal(data.total ?? 0);
      // Pre-select all
      setSelected(new Set((data.suggestions ?? []).map((_: unknown, i: number) => i)));
    } catch (err) {
      setMiningError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setMiningLoading(false);
    }
  }

  function toggleSelect(i: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  function toggleAll() {
    setSelected(selected.size === suggestions.length ? new Set() : new Set(suggestions.map((_, i) => i)));
  }

  async function handleApply() {
    const toApply = suggestions.filter((_, i) => selected.has(i));
    if (toApply.length === 0) return;

    setApplying(true);
    try {
      const res = await fetch("/api/keywords/apply-negatives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          negatives: toApply.map((s) => ({
            text: s.text,
            matchType: s.matchType,
            campaignResourceName: s.campaignResourceName,
            campaignId: s.campaignId,
          })),
        }),
      });
      const data = await res.json();
      setApplyResult({ applied: data.applied, failed: data.failed });
    } catch {
      setMiningError("Failed to apply negatives. Please try again.");
    } finally {
      setApplying(false);
    }
  }

  const totalWaste = suggestions.filter((_, i) => selected.has(i)).reduce((s, t) => s + t.spend, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", position: "relative" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap" as const, gap: "12px" }}>
        <div>
          <h1 style={{ fontFamily: '"Sora", sans-serif', fontSize: "22px", fontWeight: 800, color: "#fafafa", letterSpacing: "-0.5px", marginBottom: "3px" }}>Keywords</h1>
          <p style={{ fontSize: "13px", color: "#52525b" }}>All Google Ads keywords with performance, quality scores, and AI recommendations.</p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={handleMineNegatives}
            style={{ display: "flex", alignItems: "center", gap: "7px", padding: "9px 16px", background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.3)", borderRadius: "8px", color: "#fb923c", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
            <Sparkles size={13} /> Mine Negatives
          </button>
          <button style={{ display: "flex", alignItems: "center", gap: "7px", padding: "9px 16px", background: "#f97316", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
            <Plus size={13} /> Add Keyword
          </button>
        </div>
      </div>

      {/* Issues banner */}
      {issues.length > 0 && (
        <div style={{ padding: "12px 16px", background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "10px", display: "flex", alignItems: "center", gap: "10px" }}>
          <AlertCircle size={15} color="#f87171" />
          <span style={{ fontSize: "13px", color: "#f87171", fontWeight: 500 }}>{issues.length} keywords need attention</span>
          <span style={{ fontSize: "12.5px", color: "#71717a" }}>— low quality scores or zero conversions with high spend</span>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px" }}>
        {[
          { label: "Active Keywords", value: String(keywords.filter(k => k.status === "ACTIVE").length) },
          { label: "Avg. Quality Score", value: (keywords.reduce((s, k) => s + k.qualityScore, 0) / keywords.length).toFixed(1) },
          { label: "Total Spend", value: formatCurrency(keywords.reduce((s, k) => s + k.spend, 0)) },
          { label: "Conversions", value: String(keywords.reduce((s, k) => s + k.conversions, 0)) },
          { label: "Negative Keywords", value: String(negatives.length) },
        ].map(stat => (
          <div key={stat.label} style={{ ...S.card, padding: "14px 16px" }}>
            <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1px", color: "#3f3f46", marginBottom: "6px" }}>{stat.label}</div>
            <div style={{ fontFamily: '"Sora", sans-serif', fontSize: "19px", fontWeight: 800, color: "#fafafa", letterSpacing: "-0.5px" }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs + search */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" as const }}>
        <div style={{ display: "flex", gap: "6px" }}>
          {[{ id: "active", label: `Active (${keywords.length})` }, { id: "negatives", label: `Negatives (${negatives.length})` }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as "active" | "negatives")} style={{
              padding: "7px 14px", borderRadius: "7px", fontSize: "12.5px", fontWeight: 500, cursor: "pointer", border: "1px solid",
              background: tab === t.id ? "rgba(249,115,22,0.1)" : "transparent",
              borderColor: tab === t.id ? "rgba(249,115,22,0.4)" : "#27272e",
              color: tab === t.id ? "#fb923c" : "#71717a",
            }}>{t.label}</button>
          ))}
        </div>
        {tab === "active" && (
          <div style={{ position: "relative" }}>
            <Search size={12} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#3f3f46" }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search keywords..." style={{ height: "34px", paddingLeft: "28px", paddingRight: "12px", background: "#18181c", border: "1px solid #27272e", borderRadius: "7px", color: "#fafafa", fontSize: "12.5px", outline: "none" }} />
          </div>
        )}
      </div>

      {/* Table */}
      <div style={{ ...S.card, overflow: "hidden" }}>
        {tab === "active" ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Keyword", "Match", "Campaign", "Status", "QS", "Clicks", "Spend", "Conv.", "CPA", "Trend"].map((h, i) => (
                    <th key={h} style={{ ...S.th, textAlign: i > 3 ? "right" : "left" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(kw => {
                  const mc = matchTypeColor[kw.matchType];
                  const isIssue = kw.qualityScore < 5 || (kw.conversions === 0 && kw.spend > 5000);
                  return (
                    <tr key={kw.id}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#18181c")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      style={{ transition: "background 0.1s" }}>
                      <td style={{ padding: "12px 14px", fontSize: "12.5px", color: isIssue ? "#f87171" : "#e4e4e7", fontWeight: 500, borderBottom: "1px solid #1a1a1f", ...S.mono }}>
                        {kw.text}{isIssue && <AlertCircle size={11} style={{ display: "inline", marginLeft: "6px", color: "#f87171" }} />}
                      </td>
                      <td style={{ padding: "12px 14px", borderBottom: "1px solid #1a1a1f" }}>
                        <span style={{ padding: "2px 7px", borderRadius: "4px", fontSize: "10px", fontWeight: 700, ...mc }}>{kw.matchType}</span>
                      </td>
                      <td style={{ padding: "12px 14px", fontSize: "12px", color: "#71717a", borderBottom: "1px solid #1a1a1f" }}>{kw.campaign}</td>
                      <td style={{ padding: "12px 14px", borderBottom: "1px solid #1a1a1f" }}>
                        <span style={{ padding: "2px 7px", borderRadius: "4px", fontSize: "10px", fontWeight: 600, background: kw.status === "ACTIVE" ? "rgba(52,211,153,0.08)" : "rgba(113,113,122,0.1)", color: kw.status === "ACTIVE" ? "#34d399" : "#71717a" }}>{kw.status}</span>
                      </td>
                      <td style={{ padding: "12px 14px", textAlign: "right", borderBottom: "1px solid #1a1a1f" }}>
                        <span style={{ fontSize: "13px", fontWeight: 700, color: kw.qualityScore >= 7 ? "#34d399" : kw.qualityScore >= 5 ? "#fbbf24" : "#f87171" }}>{kw.qualityScore}</span>
                        <span style={{ fontSize: "10px", color: "#3f3f46" }}>/10</span>
                      </td>
                      <td style={{ padding: "12px 14px", textAlign: "right", fontSize: "12.5px", color: "#a1a1aa", borderBottom: "1px solid #1a1a1f", ...S.mono }}>{kw.clicks.toLocaleString("en-IN")}</td>
                      <td style={{ padding: "12px 14px", textAlign: "right", fontSize: "12.5px", color: "#a1a1aa", borderBottom: "1px solid #1a1a1f", ...S.mono }}>{formatCurrency(kw.spend)}</td>
                      <td style={{ padding: "12px 14px", textAlign: "right", fontSize: "12.5px", color: "#a1a1aa", borderBottom: "1px solid #1a1a1f", ...S.mono }}>{kw.conversions}</td>
                      <td style={{ padding: "12px 14px", textAlign: "right", fontSize: "12.5px", borderBottom: "1px solid #1a1a1f", ...S.mono, color: kw.conversions === 0 ? "#f87171" : kw.cpa < 600 ? "#34d399" : "#fbbf24" }}>
                        {kw.conversions === 0 ? "—" : formatCurrency(kw.cpa)}
                      </td>
                      <td style={{ padding: "12px 14px", textAlign: "right", borderBottom: "1px solid #1a1a1f" }}>
                        {kw.trend === "up" ? <TrendingUp size={13} color="#34d399" /> : kw.trend === "down" ? <TrendingDown size={13} color="#f87171" /> : <span style={{ fontSize: "11px", color: "#52525b" }}>—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Keyword", "Match Type", "Added By", "Est. Savings", "Added"].map((h, i) => (
                    <th key={h} style={{ ...S.th, textAlign: i > 1 ? "right" : "left" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {negatives.map((kw, i) => {
                  const mc = matchTypeColor[kw.matchType];
                  return (
                    <tr key={i}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#18181c")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      style={{ transition: "background 0.1s" }}>
                      <td style={{ padding: "12px 14px", fontSize: "12.5px", color: "#e4e4e7", borderBottom: "1px solid #1a1a1f", ...S.mono }}>{kw.text}</td>
                      <td style={{ padding: "12px 14px", borderBottom: "1px solid #1a1a1f" }}>
                        <span style={{ padding: "2px 7px", borderRadius: "4px", fontSize: "10px", fontWeight: 700, ...mc }}>{kw.matchType}</span>
                      </td>
                      <td style={{ padding: "12px 14px", textAlign: "right", borderBottom: "1px solid #1a1a1f" }}>
                        <span style={{ padding: "2px 7px", borderRadius: "4px", fontSize: "10px", fontWeight: 600, background: kw.addedBy === "AI" ? "rgba(249,115,22,0.1)" : "rgba(113,113,122,0.1)", color: kw.addedBy === "AI" ? "#fb923c" : "#71717a" }}>{kw.addedBy === "AI" ? "🤖 AI" : "Manual"}</span>
                      </td>
                      <td style={{ padding: "12px 14px", textAlign: "right", fontSize: "12.5px", fontWeight: 600, color: "#34d399", borderBottom: "1px solid #1a1a1f", ...S.mono }}>{kw.savings}</td>
                      <td style={{ padding: "12px 14px", textAlign: "right", fontSize: "11.5px", color: "#3f3f46", borderBottom: "1px solid #1a1a1f" }}>{kw.addedAt}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Mining Panel ─── */}
      {miningOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex" }}>
          {/* Backdrop */}
          <div onClick={() => !applying && setMiningOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }} />

          {/* Slide-in panel */}
          <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: "580px", background: "#111114", borderLeft: "1px solid #27272e", display: "flex", flexDirection: "column", overflowY: "auto" }}>
            {/* Panel header */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #27272e", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                  <Sparkles size={15} color="#f97316" />
                  <span style={{ fontFamily: '"Sora", sans-serif', fontSize: "15px", fontWeight: 700, color: "#fafafa" }}>AI Negative Keyword Mining</span>
                </div>
                {!miningLoading && suggestions.length > 0 && (
                  <span style={{ fontSize: "12px", color: "#52525b" }}>
                    Analysed {miningTotal} zero-conversion terms · Found {suggestions.length} to block
                  </span>
                )}
              </div>
              <button onClick={() => setMiningOpen(false)} disabled={applying} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#52525b", padding: "4px" }}>
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div style={{ flex: 1, padding: "20px 24px", overflowY: "auto" }}>
              {miningLoading && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", paddingTop: "60px" }}>
                  <Loader2 size={28} color="#f97316" style={{ animation: "spin 1s linear infinite" }} />
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#fafafa", marginBottom: "4px" }}>Pulling search terms from Google Ads…</div>
                    <div style={{ fontSize: "12.5px", color: "#52525b" }}>Claude is reviewing which ones to block</div>
                  </div>
                </div>
              )}

              {miningError && (
                <div style={{ padding: "14px 16px", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "10px", fontSize: "13px", color: "#f87171" }}>
                  {miningError}
                </div>
              )}

              {applyResult && (
                <div style={{ padding: "14px 16px", background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)", borderRadius: "10px", marginBottom: "16px" }}>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "#34d399", marginBottom: "4px" }}>
                    <Check size={14} style={{ display: "inline", marginRight: "6px" }} />
                    {applyResult.applied} negative keyword{applyResult.applied !== 1 ? "s" : ""} applied
                  </div>
                  {applyResult.failed > 0 && <div style={{ fontSize: "12px", color: "#f87171" }}>{applyResult.failed} failed — check logs</div>}
                </div>
              )}

              {!miningLoading && suggestions.length > 0 && !applyResult && (
                <>
                  {/* Select all + waste estimate */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                    <button onClick={toggleAll} style={{ display: "flex", alignItems: "center", gap: "6px", background: "transparent", border: "none", cursor: "pointer", fontSize: "12.5px", color: "#71717a" }}>
                      {selected.size === suggestions.length ? <CheckSquare size={14} color="#f97316" /> : <Square size={14} />}
                      {selected.size === suggestions.length ? "Deselect all" : "Select all"}
                    </button>
                    {selected.size > 0 && (
                      <span style={{ fontSize: "12px", color: "#34d399", fontWeight: 600 }}>
                        Est. savings: {formatCurrency(totalWaste)}/mo
                      </span>
                    )}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {suggestions.map((s, i) => {
                      const isSelected = selected.has(i);
                      return (
                        <div key={i} onClick={() => toggleSelect(i)} style={{
                          padding: "12px 14px", borderRadius: "9px", cursor: "pointer",
                          background: isSelected ? "rgba(249,115,22,0.04)" : "transparent",
                          border: `1px solid ${isSelected ? "rgba(249,115,22,0.25)" : "#27272e"}`,
                          transition: "border-color 0.15s, background 0.15s",
                          display: "flex", alignItems: "flex-start", gap: "10px",
                        }}>
                          <div style={{ marginTop: "2px", flexShrink: 0 }}>
                            {isSelected ? <CheckSquare size={14} color="#f97316" /> : <Square size={14} color="#3f3f46" />}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" as const }}>
                              <span style={{ fontSize: "12.5px", fontWeight: 600, color: "#fafafa", ...S.mono }}>{s.text}</span>
                              <span style={{ padding: "1px 6px", borderRadius: "3px", fontSize: "9px", fontWeight: 700, ...matchTypeColor[s.matchType] }}>{s.matchType}</span>
                            </div>
                            <div style={{ fontSize: "11.5px", color: "#52525b", marginBottom: "4px" }}>{s.campaignName}</div>
                            <div style={{ display: "flex", gap: "12px" }}>
                              <span style={{ fontSize: "11px", color: "#71717a" }}>{s.clicks} clicks · {formatCurrency(s.spend)} wasted</span>
                              <span style={{ fontSize: "11px", color: "#3f3f46", fontStyle: "italic" }}>{s.reason}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {!miningLoading && suggestions.length === 0 && !miningError && (
                <div style={{ textAlign: "center", paddingTop: "60px", color: "#52525b", fontSize: "13px" }}>
                  <Check size={28} color="#34d399" style={{ display: "block", margin: "0 auto 12px" }} />
                  No wasteful search terms found — your account looks clean!
                </div>
              )}
            </div>

            {/* Panel footer */}
            {!miningLoading && suggestions.length > 0 && !applyResult && (
              <div style={{ padding: "16px 24px", borderTop: "1px solid #27272e", flexShrink: 0, display: "flex", gap: "10px" }}>
                <button onClick={() => setMiningOpen(false)} style={{ flex: 1, height: "40px", background: "transparent", border: "1px solid #27272e", borderRadius: "8px", color: "#71717a", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                  Cancel
                </button>
                <button
                  onClick={handleApply}
                  disabled={selected.size === 0 || applying}
                  style={{ flex: 2, height: "40px", background: selected.size === 0 ? "rgba(249,115,22,0.3)" : "#f97316", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: selected.size === 0 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px", opacity: applying ? 0.7 : 1 }}>
                  {applying ? <><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Applying…</> : `Apply ${selected.size} Negative${selected.size !== 1 ? "s" : ""}`}
                </button>
              </div>
            )}

            {applyResult && (
              <div style={{ padding: "16px 24px", borderTop: "1px solid #27272e", flexShrink: 0 }}>
                <button onClick={() => setMiningOpen(false)} style={{ width: "100%", height: "40px", background: "#f97316", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
