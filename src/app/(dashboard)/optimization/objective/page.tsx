"use client";

import { useEffect, useState } from "react";
import { Save, Check, Sparkles } from "lucide-react";

const S = {
  card: { background: "#111114", border: "1px solid #27272e", borderRadius: "12px" },
  label: { fontSize: 13, fontWeight: 500, color: "#fafafa", display: "block" as const },
  hint: { fontSize: 12, color: "#71717a", marginTop: 4 },
};

type Vertical = "D2C" | "SAAS" | "REAL_ESTATE" | "EDTECH" | "LEAD_GEN" | "OTHER";

const VERTICAL_LABELS: Record<Vertical, string> = {
  D2C: "Direct-to-consumer (apparel, beauty, FMCG)",
  SAAS: "SaaS / B2B subscription",
  REAL_ESTATE: "Real estate",
  EDTECH: "EdTech / courses",
  LEAD_GEN: "Lead generation / services",
  OTHER: "Other",
};

const PRESETS: Record<string, { roas: number; cpa: number; volume: number; label: string }> = {
  ecommerce: { roas: 0.7, cpa: 0.2, volume: 0.1, label: "E-commerce (maximize revenue)" },
  leadgen: { roas: 0.3, cpa: 0.6, volume: 0.1, label: "Lead-gen (low cost per lead)" },
  growth: { roas: 0.2, cpa: 0.3, volume: 0.5, label: "Growth (volume first)" },
  balanced: { roas: 0.5, cpa: 0.3, volume: 0.2, label: "Balanced" },
};

export default function ObjectivePage() {
  const [roas, setRoas] = useState(0.6);
  const [cpa, setCpa] = useState(0.3);
  const [volume, setVolume] = useState(0.1);
  const [vertical, setVertical] = useState<Vertical>("D2C");
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/optimization/settings")
      .then((r) => r.json())
      .then((data) => {
        setRoas(Number(data.roasWeight ?? 0.6));
        setCpa(Number(data.cpaWeight ?? 0.3));
        setVolume(Number(data.volumeWeight ?? 0.1));
        setVertical((data.vertical as Vertical) ?? "D2C");
        setLoaded(true);
      });
  }, []);

  const sum = roas + cpa + volume;
  const valid = Math.abs(sum - 1.0) <= 0.005;

  const setWeight = (which: "roas" | "cpa" | "volume", value: number) => {
    // Normalize so the others scale proportionally to keep sum = 1
    const others = which === "roas" ? ["cpa", "volume"] : which === "cpa" ? ["roas", "volume"] : ["roas", "cpa"];
    const currentOthers = others.map((k) => (k === "roas" ? roas : k === "cpa" ? cpa : volume));
    const otherSum = currentOthers.reduce((a, b) => a + b, 0);
    const remaining = 1 - value;
    if (otherSum === 0 || remaining <= 0) {
      const split = remaining / 2;
      if (which === "roas") { setRoas(value); setCpa(split); setVolume(split); }
      else if (which === "cpa") { setCpa(value); setRoas(split); setVolume(split); }
      else { setVolume(value); setRoas(split); setCpa(split); }
      return;
    }
    const newOthers = currentOthers.map((v) => (v / otherSum) * remaining);
    if (which === "roas") { setRoas(value); setCpa(newOthers[0]); setVolume(newOthers[1]); }
    else if (which === "cpa") { setCpa(value); setRoas(newOthers[0]); setVolume(newOthers[1]); }
    else { setVolume(value); setRoas(newOthers[0]); setCpa(newOthers[1]); }
  };

  const applyPreset = (key: keyof typeof PRESETS) => {
    const p = PRESETS[key];
    setRoas(p.roas);
    setCpa(p.cpa);
    setVolume(p.volume);
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/optimization/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roasWeight: round3(roas),
          cpaWeight: round3(cpa),
          volumeWeight: round3(volume),
          vertical,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      setSavedAt(Date.now());
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) {
    return <div style={{ padding: 32, color: "#71717a" }}>Loading…</div>;
  }

  return (
    <div style={{ padding: 32, color: "#e4e4e7", maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 4 }}>AI Objective</h1>
      <p style={{ color: "#71717a", fontSize: 14, marginBottom: 24 }}>
        Tell the optimizer what matters most for your business. These weights drive every decision.
      </p>

      <div style={{ ...S.card, padding: 24, marginBottom: 16 }}>
        <label style={S.label}>Your business type</label>
        <p style={S.hint}>
          Sets the industry benchmarks the AI optimizes against (good CPC, target CPA, ROAS bands).
        </p>
        <select
          value={vertical}
          onChange={(e) => setVertical(e.target.value as Vertical)}
          style={{
            marginTop: 10,
            width: "100%",
            background: "#18181c",
            border: "1px solid #27272e",
            color: "#fafafa",
            padding: "10px 12px",
            borderRadius: 8,
            fontSize: 14,
          }}
        >
          {(Object.keys(VERTICAL_LABELS) as Vertical[]).map((v) => (
            <option key={v} value={v}>{VERTICAL_LABELS[v]}</option>
          ))}
        </select>
      </div>

      <div style={{ ...S.card, padding: 24, marginBottom: 16 }}>
        <label style={S.label}>Quick presets</label>
        <p style={S.hint}>Start here, then fine-tune the sliders.</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
          {(Object.keys(PRESETS) as (keyof typeof PRESETS)[]).map((k) => (
            <button
              key={k}
              onClick={() => applyPreset(k)}
              style={{
                background: "transparent",
                border: "1px solid #3f3f46",
                color: "#a1a1aa",
                padding: "8px 14px",
                borderRadius: 8,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              {PRESETS[k].label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ ...S.card, padding: 24, marginBottom: 16 }}>
        <SliderRow
          label="ROAS (return on ad spend)"
          hint="High weight = AI prioritizes high-revenue campaigns and scales winners aggressively."
          value={roas}
          onChange={(v) => setWeight("roas", v)}
        />
        <SliderRow
          label="CPA (cost per acquisition)"
          hint="High weight = AI cuts costs aggressively, even at the expense of volume."
          value={cpa}
          onChange={(v) => setWeight("cpa", v)}
        />
        <SliderRow
          label="Volume (raw conversion count)"
          hint="High weight = AI keeps spending where conversions are flowing, even if cost is mediocre."
          value={volume}
          onChange={(v) => setWeight("volume", v)}
        />
        <div style={{ marginTop: 16, padding: 12, background: "#0e0e10", borderRadius: 8, fontSize: 13 }}>
          <span style={{ color: valid ? "#86efac" : "#f87171" }}>
            Total: {(sum * 100).toFixed(1)}%
          </span>
          <span style={{ color: "#71717a", marginLeft: 8 }}>(must sum to 100%)</span>
        </div>
      </div>

      <div style={{ ...S.card, padding: 24, marginBottom: 16, background: "rgba(34,197,94,0.05)", borderColor: "rgba(34,197,94,0.2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <Sparkles size={16} color="#86efac" />
          <strong style={{ color: "#86efac", fontSize: 14 }}>The AI learns from you</strong>
        </div>
        <p style={{ color: "#a1a1aa", fontSize: 13, lineHeight: 1.5 }}>
          As you approve and reject the AI&apos;s proposals, it builds a per-account fingerprint of your
          house style — your bid aggressiveness, budget volatility tolerance, and creative refresh
          appetite. After 30 days, the AI is calibrated to your account; after 90 days, it&apos;s
          measurably more accurate than any competing tool on your specific business.
        </p>
      </div>

      <button
        onClick={save}
        disabled={saving || !valid}
        style={{
          background: valid ? "#f97316" : "#27272e",
          color: valid ? "#fff" : "#71717a",
          border: "none",
          padding: "10px 20px",
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 600,
          cursor: saving || !valid ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        {savedAt && Date.now() - savedAt < 3000 ? <Check size={16} /> : <Save size={16} />}
        {savedAt && Date.now() - savedAt < 3000 ? "Saved" : saving ? "Saving…" : "Save objective"}
      </button>
    </div>
  );
}

function SliderRow({ label, hint, value, onChange }: { label: string; hint: string; value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 14, color: "#e4e4e7" }}>{label}</span>
        <span style={{ fontSize: 13, color: "#f97316", fontWeight: 600 }}>{(value * 100).toFixed(0)}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: "#f97316" }}
      />
      <p style={{ fontSize: 12, color: "#71717a", marginTop: 6 }}>{hint}</p>
    </div>
  );
}

function round3(v: number): number {
  return Math.round(v * 1000) / 1000;
}
