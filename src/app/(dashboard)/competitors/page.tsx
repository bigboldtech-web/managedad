"use client";

import { useState, useEffect } from "react";
import { Plus, ExternalLink, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";

const S = {
  card: { background: "#111114", border: "1px solid #27272e", borderRadius: "12px" },
  mono: { fontFamily: "var(--font-ibm-plex-mono), monospace" },
};

interface Competitor {
  domain: string;
  impressionShare: number;
  overlapRate: number;
  posAbove: number;
  topPageRate: number;
  absTopPageRate: number;
  threat: "HIGH" | "MEDIUM" | "LOW";
}

const threatColors: Record<string, { bg: string; color: string }> = {
  HIGH: { bg: "rgba(248,113,113,0.1)", color: "#f87171" },
  MEDIUM: { bg: "rgba(251,191,36,0.1)", color: "#fbbf24" },
  LOW: { bg: "rgba(82,82,91,0.12)", color: "#71717a" },
};

// Fallback demo data for when there are no Google Ads connections
const DEMO_COMPETITORS: Competitor[] = [
  { domain: "laptopwala.com", impressionShare: 34, overlapRate: 68, posAbove: 28, topPageRate: 71, absTopPageRate: 42, threat: "HIGH" },
  { domain: "croma.com", impressionShare: 28, overlapRate: 52, posAbove: 41, topPageRate: 85, absTopPageRate: 55, threat: "HIGH" },
  { domain: "reliancedigital.in", impressionShare: 22, overlapRate: 44, posAbove: 19, topPageRate: 78, absTopPageRate: 38, threat: "MEDIUM" },
  { domain: "vijaysales.com", impressionShare: 14, overlapRate: 31, posAbove: 11, topPageRate: 62, absTopPageRate: 24, threat: "LOW" },
];

export default function CompetitorsPage() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [selected, setSelected] = useState<Competitor | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  async function loadCompetitors() {
    try {
      const res = await fetch("/api/competitors");
      if (res.ok) {
        const json = await res.json();
        if (json.hasData && json.competitors.length > 0) {
          setCompetitors(json.competitors);
          setSelected(json.competitors[0]);
          setHasData(true);
        } else {
          setCompetitors(DEMO_COMPETITORS);
          setSelected(DEMO_COMPETITORS[0]);
          setHasData(false);
        }
      }
    } catch {
      setCompetitors(DEMO_COMPETITORS);
      setSelected(DEMO_COMPETITORS[0]);
    } finally {
      setLoading(false);
    }
  }

  async function analyze() {
    setAnalyzing(true);
    try {
      const res = await fetch("/api/competitors/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ competitors: competitors.slice(0, 5) }),
      });
      if (res.ok) {
        const { analysis } = await res.json();
        setAiAnalysis(analysis);
      }
    } finally {
      setAnalyzing(false);
    }
  }

  async function refresh() {
    setRefreshing(true);
    await loadCompetitors();
    setRefreshing(false);
  }

  useEffect(() => { loadCompetitors(); }, []);

  const highestOverlap = competitors.length > 0 ? Math.max(...competitors.map((c) => c.overlapRate)) : 0;
  const highestOverlapDomain = competitors.find((c) => c.overlapRate === highestOverlap)?.domain || "—";
  const newThisWeek = competitors.filter((c) => c.threat === "HIGH").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontFamily: '"Sora", sans-serif', fontSize: "22px", fontWeight: 800, color: "#fafafa", letterSpacing: "-0.5px", marginBottom: "3px" }}>Competitors</h1>
          <p style={{ fontSize: "13px", color: "#52525b" }}>Google Auction Insights. Know exactly who you&apos;re competing against.</p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={refresh} disabled={refreshing} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 14px", background: "transparent", border: "1px solid #27272e", borderRadius: "8px", color: "#71717a", fontSize: "12.5px", cursor: "pointer" }}>
            <RefreshCw size={12} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
          <button onClick={analyze} disabled={analyzing} style={{ display: "flex", alignItems: "center", gap: "7px", padding: "9px 16px", background: "#f97316", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: analyzing ? "not-allowed" : "pointer", opacity: analyzing ? 0.7 : 1 }}>
            <Plus size={13} /> {analyzing ? "Analyzing…" : "AI Analysis"}
          </button>
        </div>
      </div>

      {!hasData && !loading && (
        <div style={{ ...S.card, padding: "12px 16px", borderColor: "rgba(251,191,36,0.2)", display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#fbbf24", flexShrink: 0 }} />
          <span style={{ fontSize: "12.5px", color: "#71717a" }}>Showing demo data — connect Google Ads to see real auction insights from your campaigns</span>
        </div>
      )}

      {/* AI Analysis panel */}
      {aiAnalysis && (
        <div style={{ ...S.card, padding: "18px 20px", borderColor: "rgba(249,115,22,0.2)" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#f97316", marginBottom: "10px" }}>AI Competitive Strategy</div>
          <div style={{ fontSize: "13px", color: "#a1a1aa", lineHeight: 1.65, whiteSpace: "pre-line" }}>{aiAnalysis}</div>
        </div>
      )}

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
        {[
          { label: "Competitors Tracked", value: loading ? "—" : String(competitors.length), sub: "in your auctions" },
          { label: "Highest Overlap", value: loading ? "—" : `${highestOverlap}%`, sub: highestOverlapDomain },
          { label: "High Threat", value: loading ? "—" : String(newThisWeek), sub: "competitors" },
          { label: "Data Source", value: hasData ? "Live" : "Demo", sub: hasData ? "Google Ads API" : "Connect account" },
        ].map(stat => (
          <div key={stat.label} style={{ ...S.card, padding: "16px 18px" }}>
            <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#3f3f46", marginBottom: "6px" }}>{stat.label}</div>
            <div style={{ fontFamily: '"Sora", sans-serif', fontSize: "22px", fontWeight: 800, color: "#fafafa", letterSpacing: "-0.5px", marginBottom: "2px" }}>{stat.value}</div>
            <div style={{ fontSize: "11px", color: "#52525b" }}>{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Main content */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "16px", alignItems: "start" }}>
        {/* Competitor list */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ ...S.card, padding: "16px 20px", height: "100px", animation: "pulse 1.5s infinite" }} />
            ))
          ) : competitors.map(comp => {
            const tc = threatColors[comp.threat];
            const isSelected = selected?.domain === comp.domain;
            return (
              <div key={comp.domain} onClick={() => setSelected(comp)} style={{
                ...S.card, padding: "16px 20px", cursor: "pointer",
                borderColor: isSelected ? "rgba(249,115,22,0.4)" : "#27272e",
                background: isSelected ? "rgba(249,115,22,0.03)" : "#111114",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                      <span style={{ fontSize: "14px", fontWeight: 600, color: "#fafafa" }}>{comp.domain}</span>
                      <span style={{ padding: "1px 7px", borderRadius: "4px", fontSize: "9.5px", fontWeight: 700, ...tc }}>{comp.threat} THREAT</span>
                    </div>
                  </div>
                  <div style={{ marginLeft: "auto" }}>
                    <ExternalLink size={11} color="#3f3f46" />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
                  {[
                    { label: "Impression Share", value: `${comp.impressionShare}%`, up: comp.impressionShare > 20 },
                    { label: "Overlap Rate", value: `${comp.overlapRate}%`, up: false },
                    { label: "Position Above", value: `${comp.posAbove}%`, up: false },
                    { label: "Top Page Rate", value: `${comp.topPageRate}%`, up: null as null },
                  ].map(m => (
                    <div key={m.label}>
                      <div style={{ fontSize: "10px", color: "#3f3f46", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>{m.label}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <span style={{ fontSize: "16px", fontWeight: 700, color: "#fafafa", ...S.mono }}>{m.value}</span>
                        {m.up !== null && (m.up ? <TrendingUp size={11} color="#34d399" /> : <TrendingDown size={11} color="#f87171" />)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Detail panel */}
        {selected && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {/* Auction Position */}
            <div style={{ ...S.card, padding: "18px" }}>
              <div style={{ fontFamily: '"Sora", sans-serif', fontSize: "13px", fontWeight: 700, color: "#fafafa", marginBottom: "14px" }}>Your Position vs {selected.domain}</div>
              {[
                { label: "You above them", value: `${100 - selected.posAbove}%`, color: "#34d399" },
                { label: "They above you", value: `${selected.posAbove}%`, color: "#f87171" },
                { label: "Overlap in same auction", value: `${selected.overlapRate}%`, color: "#fbbf24" },
                { label: "Their top page rate", value: `${selected.topPageRate}%`, color: "#818cf8" },
                { label: "Their abs. top page", value: `${selected.absTopPageRate}%`, color: "#38bdf8" },
              ].map(row => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #1a1a1f" }}>
                  <span style={{ fontSize: "12.5px", color: "#71717a" }}>{row.label}</span>
                  <span style={{ fontSize: "14px", fontWeight: 700, color: row.color, ...S.mono }}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* Threat assessment */}
            <div style={{ ...S.card, padding: "18px" }}>
              <div style={{ fontFamily: '"Sora", sans-serif', fontSize: "13px", fontWeight: 700, color: "#fafafa", marginBottom: "12px" }}>Threat Assessment</div>
              <div style={{ padding: "12px", borderRadius: "8px", background: `${threatColors[selected.threat].bg}`, border: `1px solid ${threatColors[selected.threat].color}22` }}>
                <div style={{ fontSize: "18px", fontWeight: 800, color: threatColors[selected.threat].color, marginBottom: "4px" }}>{selected.threat} THREAT</div>
                <div style={{ fontSize: "12px", color: "#71717a" }}>
                  {selected.threat === "HIGH"
                    ? `${selected.domain} is bidding on most of the same keywords and consistently beats your position. Raise bids on core terms and review quality scores.`
                    : selected.threat === "MEDIUM"
                    ? `Moderate overlap. Monitor bid changes and watch for incursions into your top campaigns.`
                    : "Low competitive overlap. Continue monitoring for changes."}
                </div>
              </div>
            </div>

            {/* Click "Analyze with AI" prompt */}
            {!aiAnalysis && (
              <div style={{ ...S.card, padding: "14px 16px", borderColor: "rgba(249,115,22,0.15)", cursor: "pointer" }} onClick={analyze}>
                <div style={{ fontSize: "12.5px", color: "#52525b" }}>
                  Click <span style={{ color: "#fb923c", fontWeight: 600 }}>AI Analysis</span> above for strategic recommendations based on these insights
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
