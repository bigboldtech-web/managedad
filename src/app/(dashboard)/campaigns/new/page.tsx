"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ArrowRight, Check, Loader2, Brain, Pencil,
  ChevronDown, ChevronUp, Sparkles, RotateCcw, Rocket,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type Platform = "GOOGLE_ADS" | "META_ADS";

/* ─── Shared styles ─── */
const S = {
  card: { background: "#111114", border: "1px solid #27272e", borderRadius: "12px" } as React.CSSProperties,
  input: { width: "100%", height: "40px", padding: "0 12px", background: "#18181c", border: "1px solid #27272e", borderRadius: "8px", color: "#fafafa", fontSize: "13px", outline: "none", boxSizing: "border-box" as const },
  label: { fontSize: "12px", fontWeight: 600, color: "#a1a1aa", marginBottom: "6px", display: "block" as const },
};

/* ═══════════════════════════════════════════════
   AI BUILDER MODE
   ═══════════════════════════════════════════════ */

interface BlueprintAdGroup {
  name: string;
  theme: string;
  keywords: { text: string; matchType: string }[];
  negativeKeywords: string[];
  ads: { headlines?: string[]; descriptions?: string[]; metaTitle?: string; metaBody?: string; finalUrl?: string }[];
}

interface Blueprint {
  campaignName: string;
  platform: string;
  objective: string;
  dailyBudget: number;
  biddingStrategy: string;
  targetLocations: string[];
  demographics: { ageRange?: string; gender?: string; devices?: string[] };
  adGroups: BlueprintAdGroup[];
  negativeKeywords: string[];
  rationale: string;
  estimatedReach?: string;
  estimatedCpa?: string;
}

function AIBuilderMode() {
  const router = useRouter();
  const [platform, setPlatform] = useState<Platform>("GOOGLE_ADS");
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [blueprintId, setBlueprintId] = useState<string | null>(null);
  const [refineInput, setRefineInput] = useState("");
  const [refining, setRefining] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<number, boolean>>({});

  const examples = platform === "GOOGLE_ADS"
    ? [
        "Target Samsung S25 users in Mumbai and Delhi for S26 Ultra launch, budget 50k/day",
        "Lead generation campaign for dental clinic in Bangalore, target people searching for dental implants",
        "E-commerce campaign for women's ethnic wear, target tier-1 cities, budget 20k/day",
      ]
    : [
        "Instagram campaign for fashion brand targeting 18-35 women in Mumbai, budget 15k/day",
        "Facebook lead ads for real estate project in Hyderabad, 3BHK apartments, 30k/day",
        "App install campaign for fintech app targeting young professionals across India",
      ];

  async function handleGenerate() {
    if (!prompt.trim()) return;
    setGenerating(true);
    setBlueprint(null);
    try {
      const res = await fetch("/api/campaigns/ai-builder/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, platform }),
      });
      if (res.ok) {
        const data = await res.json();
        setBlueprint(data.blueprint);
        setBlueprintId(data.blueprintId);
        // Expand first group by default
        setExpandedGroups({ 0: true });
      }
    } catch {}
    setGenerating(false);
  }

  async function handleRefine() {
    if (!refineInput.trim() || !blueprintId) return;
    setRefining(true);
    try {
      const res = await fetch("/api/campaigns/ai-builder/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blueprintId, feedback: refineInput }),
      });
      if (res.ok) {
        const data = await res.json();
        setBlueprint(data.blueprint);
        setRefineInput("");
      }
    } catch {}
    setRefining(false);
  }

  async function handleExecute() {
    if (!blueprintId) return;
    setExecuting(true);
    try {
      const res = await fetch("/api/campaigns/ai-builder/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blueprintId }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/campaigns/${data.campaignId}`);
        return;
      }
    } catch {}
    setExecuting(false);
  }

  function toggleGroup(idx: number) {
    setExpandedGroups((prev) => ({ ...prev, [idx]: !prev[idx] }));
  }

  const totalKeywords = blueprint?.adGroups.reduce((s, g) => s + g.keywords.length, 0) || 0;
  const totalAds = blueprint?.adGroups.reduce((s, g) => s + g.ads.length, 0) || 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Platform selector */}
      <div style={{ display: "flex", gap: "10px" }}>
        {(["GOOGLE_ADS", "META_ADS"] as Platform[]).map((p) => (
          <button key={p} onClick={() => { setPlatform(p); setBlueprint(null); }} style={{
            padding: "8px 20px", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer",
            border: `1px solid ${platform === p ? (p === "GOOGLE_ADS" ? "#4285F4" : "#1877F2") : "#27272e"}`,
            background: platform === p ? (p === "GOOGLE_ADS" ? "rgba(66,133,244,0.08)" : "rgba(24,119,242,0.08)") : "transparent",
            color: platform === p ? (p === "GOOGLE_ADS" ? "#4285F4" : "#1877F2") : "#52525b",
          }}>
            {p === "GOOGLE_ADS" ? "Google Ads" : "Meta Ads"}
          </button>
        ))}
      </div>

      {/* Prompt input */}
      {!blueprint && (
        <div style={{ ...S.card, padding: "24px" }}>
          <div style={{ fontSize: "15px", fontWeight: 700, color: "#fafafa", marginBottom: "4px" }}>
            Describe your campaign
          </div>
          <div style={{ fontSize: "12px", color: "#52525b", marginBottom: "16px" }}>
            Tell us what you want to achieve in plain language. Our AI will build a complete campaign strategy.
          </div>

          <textarea
            value={prompt} onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., I want to target people searching for Samsung S26 Ultra in Mumbai and Delhi with a daily budget of ₹50,000..."
            rows={4}
            style={{ ...S.input, height: "auto", padding: "12px", resize: "vertical" as const, lineHeight: "1.6" }}
          />

          {/* Example prompts */}
          <div style={{ marginTop: "12px" }}>
            <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#3f3f46", marginBottom: "8px" }}>
              EXAMPLE PROMPTS
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {examples.map((ex, i) => (
                <button key={i} onClick={() => setPrompt(ex)} style={{
                  textAlign: "left", padding: "8px 12px", background: "rgba(249,115,22,0.04)", border: "1px solid #1f1f25",
                  borderRadius: "6px", fontSize: "12px", color: "#71717a", cursor: "pointer", lineHeight: "1.5",
                }}>
                  {ex}
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleGenerate} disabled={generating || !prompt.trim()} style={{
            display: "flex", alignItems: "center", gap: "8px", padding: "12px 28px",
            background: generating || !prompt.trim() ? "#27272e" : "#f97316",
            border: "none", borderRadius: "10px", color: generating || !prompt.trim() ? "#52525b" : "#fff",
            fontSize: "14px", fontWeight: 700, cursor: generating || !prompt.trim() ? "not-allowed" : "pointer",
            marginTop: "16px",
          }}>
            {generating ? <><Loader2 size={16} className="animate-spin" /> Building strategy...</> : <><Sparkles size={16} /> Generate Campaign Strategy</>}
          </button>
        </div>
      )}

      {/* Blueprint review */}
      {blueprint && (
        <>
          {/* Strategy overview */}
          <div style={{ ...S.card, padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div>
                <div style={{ fontSize: "16px", fontWeight: 800, color: "#fafafa", fontFamily: '"Sora", sans-serif' }}>
                  {blueprint.campaignName}
                </div>
                <div style={{ fontSize: "12px", color: "#52525b", marginTop: "2px" }}>AI-generated strategy</div>
              </div>
              <button onClick={() => { setBlueprint(null); setBlueprintId(null); }} style={S.label as React.CSSProperties}>
                <RotateCcw size={14} /> Start over
              </button>
            </div>

            <div style={{ background: "#0d0d10", borderRadius: "8px", padding: "16px", marginBottom: "16px" }}>
              <div style={{ fontSize: "13px", color: "#a1a1aa", lineHeight: "1.7" }}>{blueprint.rationale}</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
              {[
                { label: "Budget", value: `₹${blueprint.dailyBudget.toLocaleString("en-IN")}/day` },
                { label: "Ad Groups", value: blueprint.adGroups.length },
                { label: "Keywords", value: totalKeywords },
                { label: "Ads", value: totalAds },
              ].map((kpi) => (
                <div key={kpi.label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "18px", fontWeight: 800, color: "#f97316" }}>{kpi.value}</div>
                  <div style={{ fontSize: "10px", color: "#52525b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>{kpi.label}</div>
                </div>
              ))}
            </div>

            {/* Meta info */}
            <div style={{ display: "flex", gap: "16px", marginTop: "14px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "11px", color: "#52525b" }}>Objective: <span style={{ color: "#a1a1aa" }}>{blueprint.objective}</span></span>
              <span style={{ fontSize: "11px", color: "#52525b" }}>Bidding: <span style={{ color: "#a1a1aa" }}>{blueprint.biddingStrategy}</span></span>
              <span style={{ fontSize: "11px", color: "#52525b" }}>Locations: <span style={{ color: "#a1a1aa" }}>{blueprint.targetLocations.join(", ")}</span></span>
              {blueprint.estimatedCpa && <span style={{ fontSize: "11px", color: "#52525b" }}>Est. CPA: <span style={{ color: "#34d399" }}>{blueprint.estimatedCpa}</span></span>}
            </div>
          </div>

          {/* Ad Groups */}
          {blueprint.adGroups.map((ag, idx) => (
            <div key={idx} style={{ ...S.card, overflow: "hidden" }}>
              <button onClick={() => toggleGroup(idx)} style={{
                width: "100%", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between",
                background: "transparent", border: "none", cursor: "pointer", textAlign: "left",
              }}>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "#fafafa" }}>{ag.name}</div>
                  <div style={{ fontSize: "11px", color: "#52525b", marginTop: "2px" }}>{ag.theme} &middot; {ag.keywords.length} keywords &middot; {ag.ads.length} ad{ag.ads.length !== 1 ? "s" : ""}</div>
                </div>
                {expandedGroups[idx] ? <ChevronUp size={16} color="#52525b" /> : <ChevronDown size={16} color="#52525b" />}
              </button>

              {expandedGroups[idx] && (
                <div style={{ padding: "0 20px 20px", borderTop: "1px solid #1f1f25" }}>
                  {/* Keywords */}
                  <div style={{ marginTop: "16px" }}>
                    <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#3f3f46", marginBottom: "8px" }}>KEYWORDS</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                      {ag.keywords.map((kw, ki) => {
                        const color = kw.matchType === "EXACT" ? "#34d399" : kw.matchType === "PHRASE" ? "#818cf8" : "#fbbf24";
                        return (
                          <span key={ki} style={{ padding: "3px 8px", borderRadius: "4px", fontSize: "11px", background: `${color}10`, border: `1px solid ${color}30`, color }}>
                            {kw.matchType === "EXACT" ? `[${kw.text}]` : kw.matchType === "PHRASE" ? `"${kw.text}"` : kw.text}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Negative keywords */}
                  {ag.negativeKeywords.length > 0 && (
                    <div style={{ marginTop: "14px" }}>
                      <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#3f3f46", marginBottom: "8px" }}>NEGATIVE KEYWORDS</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                        {ag.negativeKeywords.map((nk, ni) => (
                          <span key={ni} style={{ padding: "3px 8px", borderRadius: "4px", fontSize: "11px", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171" }}>
                            -{nk}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Ads */}
                  <div style={{ marginTop: "14px" }}>
                    <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#3f3f46", marginBottom: "8px" }}>AD COPY</div>
                    {ag.ads.map((ad, ai) => (
                      <div key={ai} style={{ background: "#0d0d10", borderRadius: "8px", padding: "14px", marginBottom: "8px" }}>
                        {ad.headlines && ad.headlines.length > 0 && (
                          <div style={{ marginBottom: "8px" }}>
                            <div style={{ fontSize: "10px", color: "#3f3f46", marginBottom: "4px" }}>Headlines ({ad.headlines.length})</div>
                            {ad.headlines.map((h, hi) => (
                              <div key={hi} style={{ fontSize: "12px", color: "#a1a1aa", marginBottom: "2px" }}>
                                {h} <span style={{ fontSize: "9px", color: "#3f3f46" }}>({h.length}/30)</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {ad.descriptions && ad.descriptions.length > 0 && (
                          <div>
                            <div style={{ fontSize: "10px", color: "#3f3f46", marginBottom: "4px" }}>Descriptions ({ad.descriptions.length})</div>
                            {ad.descriptions.map((d, di) => (
                              <div key={di} style={{ fontSize: "12px", color: "#a1a1aa", marginBottom: "2px" }}>
                                {d} <span style={{ fontSize: "9px", color: "#3f3f46" }}>({d.length}/90)</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {ad.metaTitle && <div style={{ fontSize: "14px", fontWeight: 700, color: "#fafafa", marginBottom: "4px" }}>{ad.metaTitle}</div>}
                        {ad.metaBody && <div style={{ fontSize: "12px", color: "#a1a1aa" }}>{ad.metaBody}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Campaign-level negatives */}
          {blueprint.negativeKeywords.length > 0 && (
            <div style={{ ...S.card, padding: "16px 20px" }}>
              <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#3f3f46", marginBottom: "8px" }}>CAMPAIGN-LEVEL NEGATIVE KEYWORDS</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                {blueprint.negativeKeywords.map((nk, i) => (
                  <span key={i} style={{ padding: "3px 8px", borderRadius: "4px", fontSize: "11px", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171" }}>
                    -{nk}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Refine */}
          <div style={{ ...S.card, padding: "16px 20px" }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#fafafa", marginBottom: "8px" }}>Refine Strategy</div>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                value={refineInput} onChange={(e) => setRefineInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRefine()}
                placeholder="e.g., Add more keywords for S25 Plus, increase budget to 80k..."
                style={{ ...S.input, flex: 1 }}
              />
              <button onClick={handleRefine} disabled={refining || !refineInput.trim()} style={{
                padding: "0 20px", background: refining ? "#27272e" : "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.2)",
                borderRadius: "8px", color: "#f97316", fontSize: "13px", fontWeight: 600, cursor: refining ? "not-allowed" : "pointer",
                whiteSpace: "nowrap",
              }}>
                {refining ? <Loader2 size={14} className="animate-spin" /> : "Refine"}
              </button>
            </div>
          </div>

          {/* Execute */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
            <button onClick={() => { setBlueprint(null); setBlueprintId(null); }} style={{
              padding: "10px 20px", background: "transparent", border: "1px solid #27272e", borderRadius: "8px",
              color: "#71717a", fontSize: "13px", cursor: "pointer",
            }}>
              Discard
            </button>
            <button onClick={handleExecute} disabled={executing} style={{
              display: "flex", alignItems: "center", gap: "8px", padding: "10px 24px",
              background: executing ? "rgba(249,115,22,0.5)" : "#f97316",
              border: "none", borderRadius: "8px", color: "#fff", fontSize: "14px", fontWeight: 700,
              cursor: executing ? "not-allowed" : "pointer",
            }}>
              {executing ? <><Loader2 size={14} className="animate-spin" /> Creating...</> : <><Rocket size={14} /> Approve & Create Campaign</>}
            </button>
          </div>
        </>
      )}

      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MANUAL MODE (original form)
   ═══════════════════════════════════════════════ */

interface CampaignFormData {
  platform: Platform | null;
  name: string;
  objective: string;
  dailyBudget: string;
  locations: string[];
  audiences: string[];
  keywords: string;
  finalUrl: string;
}

const GOOGLE_OBJECTIVES = [
  { value: "SEARCH", label: "Search" },
  { value: "DISPLAY", label: "Display" },
  { value: "SHOPPING", label: "Shopping" },
  { value: "VIDEO", label: "Video" },
  { value: "PERFORMANCE_MAX", label: "Performance Max" },
];

const META_OBJECTIVES = [
  { value: "OUTCOME_AWARENESS", label: "Awareness" },
  { value: "OUTCOME_TRAFFIC", label: "Traffic" },
  { value: "OUTCOME_ENGAGEMENT", label: "Engagement" },
  { value: "OUTCOME_LEADS", label: "Leads" },
  { value: "OUTCOME_SALES", label: "Sales" },
  { value: "OUTCOME_APP_PROMOTION", label: "App Promotion" },
];

const STEPS = ["Select Platform", "Campaign Details", "Targeting", "Review & Launch"];

function ManualMode() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [locationInput, setLocationInput] = useState("");
  const [audienceInput, setAudienceInput] = useState("");
  const [form, setForm] = useState<CampaignFormData>({
    platform: null, name: "", objective: "", dailyBudget: "", locations: [], audiences: [], keywords: "", finalUrl: "",
  });

  const objectives = form.platform === "GOOGLE_ADS" ? GOOGLE_OBJECTIVES : META_OBJECTIVES;

  const canProceed = () => {
    if (step === 0) return form.platform !== null;
    if (step === 1) return form.name.trim() !== "" && form.objective !== "" && form.dailyBudget !== "" && Number(form.dailyBudget) > 0;
    return true;
  };

  function addLocation() {
    const loc = locationInput.trim();
    if (loc && !form.locations.includes(loc)) { setForm({ ...form, locations: [...form.locations, loc] }); setLocationInput(""); }
  }
  function addAudience() {
    const aud = audienceInput.trim();
    if (aud && !form.audiences.includes(aud)) { setForm({ ...form, audiences: [...form.audiences, aud] }); setAudienceInput(""); }
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/campaigns/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: form.platform,
          name: form.name,
          objective: form.objective,
          dailyBudget: Number(form.dailyBudget),
          targetLocations: form.locations,
          keywords: form.platform === "GOOGLE_ADS"
            ? form.keywords.split("\n").map((k) => k.trim()).filter(Boolean)
            : [],
          finalUrl: form.finalUrl,
        }),
      });
      if (res.ok) { router.push("/campaigns"); return; }
    } catch {}
    router.push("/campaigns");
    setSubmitting(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Step Indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {STEPS.map((label, i) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{
              width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
              background: i <= step ? "#f97316" : "#18181c",
              border: `1px solid ${i <= step ? "#f97316" : "#27272e"}`,
              fontSize: "11px", fontWeight: 700, color: i <= step ? "#fff" : "#52525b", flexShrink: 0,
            }}>
              {i < step ? <Check size={12} /> : i + 1}
            </div>
            <span style={{ fontSize: "12px", fontWeight: i === step ? 600 : 400, color: i === step ? "#fafafa" : "#52525b", whiteSpace: "nowrap" }}>{label}</span>
            {i < STEPS.length - 1 && <div style={{ width: "32px", height: "1px", background: i < step ? "#f97316" : "#27272e" }} />}
          </div>
        ))}
      </div>

      {/* Step Card */}
      <div style={{ ...S.card, padding: "28px" }}>
        <div style={{ fontFamily: '"Sora", sans-serif', fontSize: "16px", fontWeight: 700, color: "#fafafa", marginBottom: "4px" }}>{STEPS[step]}</div>
        <div style={{ fontSize: "12.5px", color: "#52525b", marginBottom: "24px" }}>
          {step === 0 && "Choose where you want to run your campaign."}
          {step === 1 && "Configure your campaign name, objective, and budget."}
          {step === 2 && "Define your target locations and audiences."}
          {step === 3 && "Review your campaign before launching."}
        </div>

        {step === 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            {([
              { value: "GOOGLE_ADS" as Platform, title: "Google Ads", color: "#4285F4", desc: "Search, Display, Shopping, Video, and Performance Max campaigns." },
              { value: "META_ADS" as Platform, title: "Meta Ads", color: "#1877F2", desc: "Facebook and Instagram campaigns for awareness, traffic, leads, and sales." },
            ]).map((p) => (
              <button key={p.value} onClick={() => setForm({ ...form, platform: p.value, objective: "" })} style={{
                padding: "20px", borderRadius: "10px", textAlign: "left", cursor: "pointer",
                background: form.platform === p.value ? `${p.color}0d` : "#18181c",
                border: `2px solid ${form.platform === p.value ? p.color : "#27272e"}`,
              }}>
                <div style={{ fontSize: "15px", fontWeight: 700, color: "#fafafa", marginBottom: "8px" }}>{p.title}</div>
                <div style={{ fontSize: "12px", color: "#71717a", lineHeight: 1.5 }}>{p.desc}</div>
              </button>
            ))}
          </div>
        )}

        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div><label style={S.label}>Campaign Name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., Brand Awareness — India Q1" style={S.input} /></div>
            <div>
              <label style={S.label}>Objective</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginTop: "6px" }}>
                {objectives.map((obj) => (
                  <button key={obj.value} onClick={() => setForm({ ...form, objective: obj.value })} style={{
                    padding: "10px 8px", borderRadius: "8px", fontSize: "12.5px", fontWeight: 500, cursor: "pointer",
                    border: `1px solid ${form.objective === obj.value ? "rgba(249,115,22,0.5)" : "#27272e"}`,
                    background: form.objective === obj.value ? "rgba(249,115,22,0.08)" : "transparent",
                    color: form.objective === obj.value ? "#fb923c" : "#71717a",
                  }}>{obj.label}</button>
                ))}
              </div>
            </div>
            <div><label style={S.label}>Daily Budget (₹)</label><input type="number" value={form.dailyBudget} onChange={(e) => setForm({ ...form, dailyBudget: e.target.value })} placeholder="5000" min="1" style={{ ...S.input, maxWidth: "200px" }} /></div>
            <div><label style={S.label}>Final URL</label><input value={form.finalUrl} onChange={(e) => setForm({ ...form, finalUrl: e.target.value })} placeholder="https://yourwebsite.com/page" style={S.input} /></div>
            {form.platform === "GOOGLE_ADS" && (
              <div>
                <label style={S.label}>Keywords (one per line)</label>
                <textarea value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} placeholder={"buy laptop india\nbest laptop under 50000"} rows={5} style={{ ...S.input, height: "100px", resize: "vertical" as const, padding: "10px 12px" }} />
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
            <div>
              <label style={S.label}>Target Locations</label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input value={locationInput} onChange={(e) => setLocationInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addLocation()} placeholder="e.g., Mumbai, Delhi" style={{ ...S.input, flex: 1 }} />
                <button onClick={addLocation} style={{ padding: "0 16px", background: "transparent", border: "1px solid #27272e", borderRadius: "8px", color: "#a1a1aa", fontSize: "13px", cursor: "pointer" }}>Add</button>
              </div>
              {form.locations.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "10px" }}>
                  {form.locations.map((loc) => (
                    <span key={loc} onClick={() => setForm({ ...form, locations: form.locations.filter((l) => l !== loc) })} style={{ padding: "3px 10px", borderRadius: "6px", fontSize: "12px", background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)", color: "#fb923c", cursor: "pointer" }}>{loc} ×</span>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label style={S.label}>Target Audiences</label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input value={audienceInput} onChange={(e) => setAudienceInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addAudience()} placeholder="e.g., Small business owners" style={{ ...S.input, flex: 1 }} />
                <button onClick={addAudience} style={{ padding: "0 16px", background: "transparent", border: "1px solid #27272e", borderRadius: "8px", color: "#a1a1aa", fontSize: "13px", cursor: "pointer" }}>Add</button>
              </div>
              {form.audiences.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "10px" }}>
                  {form.audiences.map((aud) => (
                    <span key={aud} onClick={() => setForm({ ...form, audiences: form.audiences.filter((a) => a !== aud) })} style={{ padding: "3px 10px", borderRadius: "6px", fontSize: "12px", background: "rgba(129,140,248,0.08)", border: "1px solid rgba(129,140,248,0.2)", color: "#818cf8", cursor: "pointer" }}>{aud} ×</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ ...S.card, background: "#0d0d10", padding: "20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px" }}>
            {[
              { label: "Platform", value: form.platform === "GOOGLE_ADS" ? "Google Ads" : "Meta Ads" },
              { label: "Campaign Name", value: form.name },
              { label: "Objective", value: form.objective.replace("OUTCOME_", "").replace(/_/g, " ") || "—" },
              { label: "Daily Budget", value: formatCurrency(Number(form.dailyBudget)) },
              { label: "Locations", value: form.locations.length > 0 ? form.locations.join(", ") : "All locations" },
              { label: "Audiences", value: form.audiences.length > 0 ? form.audiences.join(", ") : "Broad audience" },
            ].map((item) => (
              <div key={item.label}>
                <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#3f3f46", marginBottom: "4px" }}>{item.label}</div>
                <div style={{ fontSize: "13.5px", fontWeight: 500, color: "#fafafa" }}>{item.value}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <button onClick={() => step > 0 ? setStep(step - 1) : undefined} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 18px", background: "transparent", border: "1px solid #27272e", borderRadius: "8px", color: "#71717a", fontSize: "13px", cursor: "pointer" }}>
          <ArrowLeft size={13} /> {step > 0 ? "Previous" : "Cancel"}
        </button>
        {step < STEPS.length - 1 ? (
          <button onClick={() => setStep(step + 1)} disabled={!canProceed()} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 18px", background: canProceed() ? "#f97316" : "#27272e", border: "none", borderRadius: "8px", color: canProceed() ? "#fff" : "#52525b", fontSize: "13px", fontWeight: 600, cursor: canProceed() ? "pointer" : "not-allowed" }}>
            Next <ArrowRight size={13} />
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={submitting} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 20px", background: submitting ? "rgba(249,115,22,0.5)" : "#f97316", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: submitting ? "not-allowed" : "pointer" }}>
            {submitting && <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />}
            Launch Campaign
          </button>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════ */

export default function NewCampaignPage() {
  const [mode, setMode] = useState<"ai" | "manual">("ai");

  return (
    <div style={{ maxWidth: "680px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: '"Sora", sans-serif', fontSize: "22px", fontWeight: 800, color: "#fafafa", letterSpacing: "-0.5px", marginBottom: "3px" }}>Create Campaign</h1>
        <p style={{ fontSize: "13px", color: "#52525b" }}>Build a complete campaign strategy with AI, or set it up manually.</p>
      </div>

      {/* Mode Toggle */}
      <div style={{ display: "flex", gap: "8px", background: "#111114", padding: "4px", borderRadius: "10px", border: "1px solid #27272e" }}>
        <button onClick={() => setMode("ai")} style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
          padding: "10px", borderRadius: "8px", border: "none", cursor: "pointer",
          background: mode === "ai" ? "#f97316" : "transparent",
          color: mode === "ai" ? "#fff" : "#52525b",
          fontSize: "13px", fontWeight: 700, transition: "all 0.2s",
        }}>
          <Brain size={16} /> AI Builder
          <span style={{ fontSize: "9px", padding: "2px 6px", borderRadius: "4px", background: mode === "ai" ? "rgba(255,255,255,0.2)" : "rgba(249,115,22,0.1)", color: mode === "ai" ? "#fff" : "#f97316", fontWeight: 800 }}>
            RECOMMENDED
          </span>
        </button>
        <button onClick={() => setMode("manual")} style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
          padding: "10px", borderRadius: "8px", border: "none", cursor: "pointer",
          background: mode === "manual" ? "#27272e" : "transparent",
          color: mode === "manual" ? "#fafafa" : "#52525b",
          fontSize: "13px", fontWeight: 600, transition: "all 0.2s",
        }}>
          <Pencil size={14} /> Manual Setup
        </button>
      </div>

      {mode === "ai" ? <AIBuilderMode /> : <ManualMode />}
    </div>
  );
}
