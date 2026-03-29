"use client";

import { useState, useEffect } from "react";
import { Zap, TrendingUp, TrendingDown, Eye, BarChart3, X, Loader2, Check, ChevronLeft, ChevronRight, Send } from "lucide-react";
import type { GeneratedVariant } from "@/app/api/creatives/generate/route";

const S = {
  card: { background: "#111114", border: "1px solid #27272e", borderRadius: "12px" },
  mono: { fontFamily: "var(--font-ibm-plex-mono), monospace" },
};

interface Creative {
  id: string;
  name: string;
  platform: "GOOGLE_ADS" | "META_ADS";
  type: string;
  status: "ACTIVE" | "PAUSED" | "LEARNING";
  ctr: number;
  conversions: number;
  spend: number;
  roas: number;
  frequency?: number;
  headline: string;
  description: string;
  score: number;
  scoreBreakdown: { label: string; score: number; color: string }[];
  fatigued: boolean;
}


function CharBar({ text, max, label }: { text: string; max: number; label: string }) {
  const len = text.length;
  const pct = Math.min((len / max) * 100, 100);
  const color = len > max ? "#f87171" : len > max * 0.85 ? "#fbbf24" : "#34d399";
  return (
    <div style={{ marginBottom: "3px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
        <span style={{ fontSize: "10px", color: "#52525b" }}>{label}</span>
        <span style={{ fontSize: "10px", color, ...S.mono }}>{len}/{max}</span>
      </div>
      <div style={{ height: "3px", background: "#1f1f25", borderRadius: "2px" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "2px" }} />
      </div>
    </div>
  );
}

export default function CreativesPage() {
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [selected, setSelected] = useState<Creative | null>(null);

  useEffect(() => {
    async function fetchCreatives() {
      try {
        const res = await fetch("/api/creatives");
        if (res.ok) {
          const data = await res.json();
          if (data.length) { setCreatives(data); setSelected(data[0]); }
        }
      } catch {}
    }
    fetchCreatives();
  }, []);
  const [tab, setTab] = useState<"all" | "fatigued">("all");

  // Generate panel state
  const [genOpen, setGenOpen] = useState(false);
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [variants, setVariants] = useState<GeneratedVariant[]>([]);
  const [variantIdx, setVariantIdx] = useState(0);
  const [pushingIdx, setPushingIdx] = useState<number | null>(null);
  const [pushedSet, setPushedSet] = useState<Set<number>>(new Set());
  const [genCreative, setGenCreative] = useState<Creative | null>(null);

  const filtered = tab === "fatigued" ? creatives.filter(c => c.fatigued) : creatives;

  async function handleGenerate(creative: Creative) {
    setGenCreative(creative);
    setGenOpen(true);
    setGenLoading(true);
    setGenError(null);
    setVariants([]);
    setVariantIdx(0);
    setPushedSet(new Set());

    try {
      const res = await fetch("/api/creatives/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adId: creative.id, count: 5 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setVariants(data.variants ?? []);
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setGenLoading(false);
    }
  }

  async function handlePush(idx: number) {
    if (!genCreative) return;
    setPushingIdx(idx);
    try {
      const res = await fetch("/api/creatives/push-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adId: genCreative.id, variant: variants[idx] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Push failed");
      setPushedSet((prev) => new Set([...prev, idx]));
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "Push failed");
    } finally {
      setPushingIdx(null);
    }
  }

  const currentVariant = variants[variantIdx];
  const isGoogle = genCreative?.platform === "GOOGLE_ADS";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", position: "relative" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap" as const, gap: "12px" }}>
        <div>
          <h1 style={{ fontFamily: '"Sora", sans-serif', fontSize: "22px", fontWeight: 800, color: "#fafafa", letterSpacing: "-0.5px", marginBottom: "3px" }}>Creatives</h1>
          <p style={{ fontSize: "13px", color: "#52525b" }}>AI analysis of all active ads. Spot fatigue, low scores, and generate winning variations.</p>
        </div>
        <button
          onClick={() => selected && handleGenerate(selected)}
          style={{ display: "flex", alignItems: "center", gap: "7px", padding: "9px 16px", background: "#f97316", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
          <Zap size={13} /> Generate New Ad
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
        {[
          { label: "Total Active Creatives", value: String(creatives.filter(c => c.status === "ACTIVE").length), sub: "across platforms" },
          { label: "Avg. Creative Score", value: `${Math.round(creatives.reduce((s, c) => s + c.score, 0) / creatives.length)}%`, sub: "AI quality rating" },
          { label: "Fatigued Ads", value: String(creatives.filter(c => c.fatigued).length), sub: "need refresh" },
          { label: "Top ROAS Creative", value: `${Math.max(...creatives.map(c => c.roas)).toFixed(1)}x`, sub: "retargeting carousel" },
        ].map(stat => (
          <div key={stat.label} style={{ ...S.card, padding: "16px 18px" }}>
            <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1px", color: "#3f3f46", marginBottom: "6px" }}>{stat.label}</div>
            <div style={{ fontFamily: '"Sora", sans-serif', fontSize: "21px", fontWeight: 800, color: "#fafafa", letterSpacing: "-0.5px", marginBottom: "2px" }}>{stat.value}</div>
            <div style={{ fontSize: "11px", color: "#52525b" }}>{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Main content */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "16px", alignItems: "start" }}>
        {/* List */}
        <div style={{ ...S.card, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #27272e", display: "flex", alignItems: "center", gap: "12px" }}>
            {[{ id: "all", label: "All Creatives" }, { id: "fatigued", label: `🔴 Fatigued (${creatives.filter(c => c.fatigued).length})` }].map(t => (
              <button key={t.id} onClick={() => setTab(t.id as "all" | "fatigued")} style={{
                padding: "5px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: 500, cursor: "pointer", border: "1px solid",
                background: tab === t.id ? "rgba(249,115,22,0.1)" : "transparent",
                borderColor: tab === t.id ? "rgba(249,115,22,0.4)" : "#27272e",
                color: tab === t.id ? "#fb923c" : "#52525b",
              }}>{t.label}</button>
            ))}
          </div>
          {filtered.map((c) => (
            <div key={c.id}
              onClick={() => setSelected(c)}
              style={{
                padding: "14px 18px", borderBottom: "1px solid #1a1a1f", cursor: "pointer",
                background: selected?.id === c.id ? "rgba(249,115,22,0.04)" : "transparent",
                borderLeft: selected?.id === c.id ? "2px solid #f97316" : "2px solid transparent",
                transition: "background 0.1s",
              }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" as const }}>
                    <span style={{ fontSize: "13px", fontWeight: 500, color: "#e4e4e7" }}>{c.name}</span>
                    {c.fatigued && <span style={{ padding: "1px 6px", borderRadius: "4px", fontSize: "9.5px", fontWeight: 700, background: "rgba(248,113,113,0.12)", color: "#f87171" }}>FATIGUED</span>}
                    <span style={{ padding: "1px 6px", borderRadius: "4px", fontSize: "9.5px", fontWeight: 600, background: c.platform === "GOOGLE_ADS" ? "rgba(66,133,244,0.1)" : "rgba(24,119,242,0.1)", color: c.platform === "GOOGLE_ADS" ? "#4285F4" : "#1877F2" }}>
                      {c.platform === "GOOGLE_ADS" ? "Google" : "Meta"} · {c.type}
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#52525b", marginBottom: "8px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.headline}</div>
                  <div style={{ display: "flex", gap: "16px" }}>
                    {[{ label: "CTR", value: `${c.ctr}%` }, { label: "ROAS", value: `${c.roas}x` }, { label: "Conv.", value: String(c.conversions) }].map(m => (
                      <div key={m.label}>
                        <span style={{ fontSize: "10px", color: "#3f3f46", textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>{m.label} </span>
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "#a1a1aa", ...S.mono }}>{m.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ width: "44px", height: "44px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: c.score >= 80 ? "rgba(52,211,153,0.1)" : c.score >= 60 ? "rgba(251,191,36,0.1)" : "rgba(248,113,113,0.1)", border: `2px solid ${c.score >= 80 ? "#34d399" : c.score >= 60 ? "#fbbf24" : "#f87171"}` }}>
                  <span style={{ fontSize: "12px", fontWeight: 800, color: c.score >= 80 ? "#34d399" : c.score >= 60 ? "#fbbf24" : "#f87171" }}>{c.score}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Detail panel */}
        {selected && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ ...S.card, padding: "18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                <BarChart3 size={14} color="#f97316" />
                <span style={{ fontFamily: '"Sora", sans-serif', fontSize: "13px", fontWeight: 700, color: "#fafafa" }}>AI Score</span>
                <span style={{ marginLeft: "auto", fontFamily: '"Sora", sans-serif', fontSize: "20px", fontWeight: 800, color: selected.score >= 80 ? "#34d399" : selected.score >= 60 ? "#fbbf24" : "#f87171" }}>{selected.score}%</span>
              </div>
              {selected.scoreBreakdown.map(sb => (
                <div key={sb.label} style={{ marginBottom: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ fontSize: "11.5px", color: "#71717a" }}>{sb.label}</span>
                    <span style={{ fontSize: "11.5px", fontWeight: 600, color: sb.color, ...S.mono }}>{sb.score}%</span>
                  </div>
                  <div style={{ height: "4px", background: "#1f1f25", borderRadius: "2px" }}>
                    <div style={{ height: "100%", width: `${sb.score}%`, background: sb.color, borderRadius: "2px", transition: "width 0.6s ease" }} />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ ...S.card, padding: "18px" }}>
              <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1px", color: "#3f3f46", marginBottom: "12px" }}>Ad Preview</div>
              <div style={{ background: "#0d0d10", borderRadius: "8px", padding: "12px", border: "1px solid #1a1a1f" }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#fafafa", marginBottom: "4px", lineHeight: 1.35 }}>{selected.headline}</div>
                <div style={{ fontSize: "11px", color: "#52525b", lineHeight: 1.5, marginBottom: "10px" }}>{selected.description}</div>
                <div style={{ display: "inline-block", padding: "5px 12px", background: "#f97316", borderRadius: "5px", fontSize: "11px", fontWeight: 700, color: "#fff" }}>Learn More →</div>
              </div>
            </div>

            <div style={{ ...S.card, padding: "18px" }}>
              <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1px", color: "#3f3f46", marginBottom: "10px" }}>Actions</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <button
                  onClick={() => handleGenerate(selected)}
                  style={{ padding: "8px 14px", background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.3)", borderRadius: "7px", color: "#fb923c", fontSize: "12.5px", fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Zap size={12} /> Generate 5 Variations
                </button>
                <button style={{ padding: "8px 14px", background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.2)", borderRadius: "7px", color: "#34d399", fontSize: "12.5px", fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                  <TrendingUp size={12} /> Start A/B Test
                </button>
                {selected.fatigued && (
                  <button style={{ padding: "8px 14px", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "7px", color: "#f87171", fontSize: "12.5px", fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                    <TrendingDown size={12} /> Pause Fatigued Ad
                  </button>
                )}
                <button style={{ padding: "8px 14px", background: "transparent", border: "1px solid #27272e", borderRadius: "7px", color: "#71717a", fontSize: "12.5px", fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Eye size={12} /> View Full Report
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── Generate Variations Panel ─── */}
      {genOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex" }}>
          <div onClick={() => !genLoading && pushingIdx === null && setGenOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }} />
          <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: "600px", background: "#111114", borderLeft: "1px solid #27272e", display: "flex", flexDirection: "column" }}>
            {/* Header */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #27272e", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                  <Zap size={14} color="#f97316" />
                  <span style={{ fontFamily: '"Sora", sans-serif', fontSize: "15px", fontWeight: 700, color: "#fafafa" }}>AI Creative Variations</span>
                </div>
                {genCreative && <span style={{ fontSize: "12px", color: "#52525b" }}>{genCreative.name} · {genCreative.platform === "GOOGLE_ADS" ? "RSA" : "Meta"}</span>}
              </div>
              <button onClick={() => setGenOpen(false)} disabled={genLoading} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#52525b", padding: "4px" }}>
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
              {genLoading && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", paddingTop: "60px" }}>
                  <Loader2 size={28} color="#f97316" style={{ animation: "spin 1s linear infinite" }} />
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#fafafa", marginBottom: "4px" }}>Claude is writing your ad variations…</div>
                    <div style={{ fontSize: "12.5px", color: "#52525b" }}>Analysing performance data and generating {isGoogle ? "RSA" : "Meta"} copy</div>
                  </div>
                </div>
              )}

              {genError && (
                <div style={{ padding: "14px 16px", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "10px", fontSize: "13px", color: "#f87171" }}>
                  {genError}
                </div>
              )}

              {!genLoading && variants.length > 0 && currentVariant && (
                <>
                  {/* Variant navigator */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <button onClick={() => setVariantIdx(Math.max(0, variantIdx - 1))} disabled={variantIdx === 0} style={{ background: "transparent", border: "1px solid #27272e", borderRadius: "6px", padding: "5px 8px", cursor: "pointer", color: "#71717a", opacity: variantIdx === 0 ? 0.4 : 1 }}>
                        <ChevronLeft size={13} />
                      </button>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "#fafafa" }}>Variant {variantIdx + 1} / {variants.length}</span>
                      <button onClick={() => setVariantIdx(Math.min(variants.length - 1, variantIdx + 1))} disabled={variantIdx === variants.length - 1} style={{ background: "transparent", border: "1px solid #27272e", borderRadius: "6px", padding: "5px 8px", cursor: "pointer", color: "#71717a", opacity: variantIdx === variants.length - 1 ? 0.4 : 1 }}>
                        <ChevronRight size={13} />
                      </button>
                    </div>
                    {pushedSet.has(variantIdx) ? (
                      <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "#34d399" }}><Check size={12} /> Pushed as draft</span>
                    ) : (
                      <button
                        onClick={() => handlePush(variantIdx)}
                        disabled={pushingIdx !== null}
                        style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 14px", background: "#f97316", border: "none", borderRadius: "7px", color: "#fff", fontSize: "12.5px", fontWeight: 600, cursor: "pointer", opacity: pushingIdx !== null ? 0.6 : 1 }}>
                        {pushingIdx === variantIdx ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={12} />}
                        Push to {isGoogle ? "Google Ads" : "Meta"} as Draft
                      </button>
                    )}
                  </div>

                  {/* Google RSA variant */}
                  {isGoogle && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      <div style={{ ...S.card, padding: "16px" }}>
                        <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1px", color: "#3f3f46", marginBottom: "12px" }}>
                          Headlines ({currentVariant.headlines.length}/15)
                        </div>
                        {currentVariant.headlines.map((h, i) => (
                          <div key={i} style={{ marginBottom: "8px" }}>
                            <div style={{ fontSize: "12.5px", color: "#e4e4e7", padding: "7px 10px", background: "#18181c", borderRadius: "6px", marginBottom: "3px", ...S.mono }}>{h}</div>
                            <CharBar text={h} max={30} label={`H${i + 1}`} />
                          </div>
                        ))}
                      </div>
                      <div style={{ ...S.card, padding: "16px" }}>
                        <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1px", color: "#3f3f46", marginBottom: "12px" }}>
                          Descriptions ({currentVariant.descriptions.length}/4)
                        </div>
                        {currentVariant.descriptions.map((d, i) => (
                          <div key={i} style={{ marginBottom: "8px" }}>
                            <div style={{ fontSize: "12.5px", color: "#e4e4e7", padding: "7px 10px", background: "#18181c", borderRadius: "6px", marginBottom: "3px" }}>{d}</div>
                            <CharBar text={d} max={90} label={`D${i + 1}`} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Meta variant */}
                  {!isGoogle && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      <div style={{ ...S.card, padding: "16px" }}>
                        <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1px", color: "#3f3f46", marginBottom: "8px" }}>Headline</div>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: "#fafafa", padding: "8px 10px", background: "#18181c", borderRadius: "6px", marginBottom: "4px" }}>{currentVariant.metaTitle}</div>
                        <CharBar text={currentVariant.metaTitle ?? ""} max={40} label="Headline" />
                      </div>
                      <div style={{ ...S.card, padding: "16px" }}>
                        <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1px", color: "#3f3f46", marginBottom: "8px" }}>Primary Text</div>
                        <div style={{ fontSize: "12.5px", color: "#a1a1aa", padding: "10px", background: "#18181c", borderRadius: "6px", lineHeight: 1.6, marginBottom: "4px" }}>{currentVariant.metaBody}</div>
                        <CharBar text={currentVariant.metaBody ?? ""} max={125} label="Body (recommended)" />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            {!genLoading && variants.length > 0 && (
              <div style={{ padding: "14px 24px", borderTop: "1px solid #27272e", flexShrink: 0, fontSize: "11.5px", color: "#3f3f46", textAlign: "center" as const }}>
                All drafts are pushed as <strong style={{ color: "#52525b" }}>PAUSED</strong> — review in Google Ads / Meta before activating
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
