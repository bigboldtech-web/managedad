"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type Platform = "GOOGLE_ADS" | "META_ADS";

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

const S = {
  card: { background: "#111114", border: "1px solid #27272e", borderRadius: "12px" },
  input: { width: "100%", height: "40px", padding: "0 12px", background: "#18181c", border: "1px solid #27272e", borderRadius: "8px", color: "#fafafa", fontSize: "13px", outline: "none", boxSizing: "border-box" as const },
  label: { fontSize: "12px", fontWeight: 600, color: "#a1a1aa", marginBottom: "6px", display: "block" as const },
};

export default function NewCampaignPage() {
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
    <div style={{ maxWidth: "680px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: '"Sora", sans-serif', fontSize: "22px", fontWeight: 800, color: "#fafafa", letterSpacing: "-0.5px", marginBottom: "3px" }}>Create Campaign</h1>
        <p style={{ fontSize: "13px", color: "#52525b" }}>Set up a new campaign across Google Ads or Meta Ads.</p>
      </div>

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

        {/* Step 0: Platform */}
        {step === 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            {[
              { value: "GOOGLE_ADS" as Platform, title: "Google Ads", color: "#4285F4", desc: "Search, Display, Shopping, Video, and Performance Max campaigns." },
              { value: "META_ADS" as Platform, title: "Meta Ads", color: "#1877F2", desc: "Facebook and Instagram campaigns for awareness, traffic, leads, and sales." },
            ].map((p) => (
              <button key={p.value} onClick={() => setForm({ ...form, platform: p.value, objective: "" })} style={{
                padding: "20px", borderRadius: "10px", textAlign: "left", cursor: "pointer", transition: "all 0.15s",
                background: form.platform === p.value ? `${p.color}0d` : "#18181c",
                border: `2px solid ${form.platform === p.value ? p.color : "#27272e"}`,
              }}>
                <div style={{ fontFamily: '"Sora", sans-serif', fontSize: "15px", fontWeight: 700, color: "#fafafa", marginBottom: "8px" }}>{p.title}</div>
                <div style={{ fontSize: "12px", color: "#71717a", lineHeight: 1.5 }}>{p.desc}</div>
              </button>
            ))}
          </div>
        )}

        {/* Step 1: Details */}
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div>
              <label style={S.label}>Campaign Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., Brand Awareness — India Q1" style={S.input} />
            </div>
            <div>
              <label style={S.label}>Objective</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginTop: "6px" }}>
                {objectives.map((obj) => (
                  <button key={obj.value} onClick={() => setForm({ ...form, objective: obj.value })} style={{
                    padding: "10px 8px", borderRadius: "8px", fontSize: "12.5px", fontWeight: 500, cursor: "pointer", transition: "all 0.15s",
                    border: `1px solid ${form.objective === obj.value ? "rgba(249,115,22,0.5)" : "#27272e"}`,
                    background: form.objective === obj.value ? "rgba(249,115,22,0.08)" : "transparent",
                    color: form.objective === obj.value ? "#fb923c" : "#71717a",
                  }}>{obj.label}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={S.label}>Daily Budget (₹)</label>
              <input type="number" value={form.dailyBudget} onChange={(e) => setForm({ ...form, dailyBudget: e.target.value })} placeholder="5000" min="1" step="1" style={{ ...S.input, maxWidth: "200px" }} />
            </div>
            <div>
              <label style={S.label}>Final URL</label>
              <input value={form.finalUrl} onChange={(e) => setForm({ ...form, finalUrl: e.target.value })} placeholder="https://yourwebsite.com/page" style={S.input} />
            </div>
            {form.platform === "GOOGLE_ADS" && (
              <div>
                <label style={S.label}>Keywords (one per line)</label>
                <textarea value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} placeholder={"buy laptop india\nbest laptop under 50000\nlaptop online"} rows={5} style={{ ...S.input, height: "100px", resize: "vertical" as const, padding: "10px 12px" }} />
                <div style={{ fontSize: "11px", color: "#3f3f46", marginTop: "4px" }}>Up to 20 keywords — added as Broad match. ManagedAd refines match types automatically.</div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Targeting */}
        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
            <div>
              <label style={S.label}>Target Locations</label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input value={locationInput} onChange={(e) => setLocationInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addLocation()} placeholder="e.g., Mumbai, Delhi, Karnataka" style={{ ...S.input, flex: 1 }} />
                <button onClick={addLocation} style={{ padding: "0 16px", background: "transparent", border: "1px solid #27272e", borderRadius: "8px", color: "#a1a1aa", fontSize: "13px", cursor: "pointer", whiteSpace: "nowrap" }}>Add</button>
              </div>
              {form.locations.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "10px" }}>
                  {form.locations.map((loc) => (
                    <span key={loc} onClick={() => setForm({ ...form, locations: form.locations.filter((l) => l !== loc) })} style={{ padding: "3px 10px", borderRadius: "6px", fontSize: "12px", background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)", color: "#fb923c", cursor: "pointer" }}>
                      {loc} ×
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label style={S.label}>Target Audiences</label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input value={audienceInput} onChange={(e) => setAudienceInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addAudience()} placeholder="e.g., Small business owners, 25-45" style={{ ...S.input, flex: 1 }} />
                <button onClick={addAudience} style={{ padding: "0 16px", background: "transparent", border: "1px solid #27272e", borderRadius: "8px", color: "#a1a1aa", fontSize: "13px", cursor: "pointer", whiteSpace: "nowrap" }}>Add</button>
              </div>
              {form.audiences.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "10px" }}>
                  {form.audiences.map((aud) => (
                    <span key={aud} onClick={() => setForm({ ...form, audiences: form.audiences.filter((a) => a !== aud) })} style={{ padding: "3px 10px", borderRadius: "6px", fontSize: "12px", background: "rgba(129,140,248,0.08)", border: "1px solid rgba(129,140,248,0.2)", color: "#818cf8", cursor: "pointer" }}>
                      {aud} ×
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Review */}
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
        <button onClick={() => step > 0 ? setStep(step - 1) : router.back()} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 18px", background: "transparent", border: "1px solid #27272e", borderRadius: "8px", color: "#71717a", fontSize: "13px", cursor: "pointer" }}>
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
