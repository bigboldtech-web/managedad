"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Check } from "lucide-react";

const S = {
  card: { background: "#111114", border: "1px solid #27272e", borderRadius: "12px" },
  input: { height: "38px", padding: "0 12px", background: "#18181c", border: "1px solid #27272e", borderRadius: "7px", color: "#fafafa", fontSize: "13px", outline: "none", boxSizing: "border-box" as const, width: "200px", fontFamily: "inherit" },
  label: { fontSize: "13px", fontWeight: 500, color: "#fafafa", marginBottom: "2px", display: "block" as const },
  hint: { fontSize: "11.5px", color: "#52525b", marginBottom: "6px", display: "block" as const },
};

interface Settings {
  isEnabled: boolean; runFrequency: string; autoApply: boolean;
  minImpressions: number; lowPerformanceThreshold: number;
  highPerformanceThreshold: number; maxBudgetIncrease: number; maxBudgetDecrease: number;
}

const DEFAULT: Settings = {
  isEnabled: true, runFrequency: "WEEKLY", autoApply: false,
  minImpressions: 100, lowPerformanceThreshold: 0.5,
  highPerformanceThreshold: 2.0, maxBudgetIncrease: 25, maxBudgetDecrease: 50,
};

function Toggle({ value, onChange }: { value: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} style={{ width: "42px", height: "24px", borderRadius: "12px", border: "none", cursor: "pointer", background: value ? "#f97316" : "#27272e", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
      <span style={{ position: "absolute", top: "3px", left: value ? "21px" : "3px", width: "18px", height: "18px", borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
    </button>
  );
}

export default function OptimizationSettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/optimization/settings")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) setSettings({
          isEnabled: d.isEnabled ?? true, runFrequency: d.runFrequency ?? "WEEKLY",
          autoApply: d.autoApply ?? false, minImpressions: d.minImpressions ?? 100,
          lowPerformanceThreshold: Number(d.lowPerformanceThreshold ?? 0.5),
          highPerformanceThreshold: Number(d.highPerformanceThreshold ?? 2.0),
          maxBudgetIncrease: Number(d.maxBudgetIncrease ?? 25),
          maxBudgetDecrease: Number(d.maxBudgetDecrease ?? 50),
        });
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/optimization/settings", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    } catch { /* silent */ }
    setSaving(false);
  }

  if (loading) return <div style={{ padding: "60px", textAlign: "center", color: "#3f3f46", fontSize: "13px" }}>Loading settings...</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "640px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <Link href="/optimization" style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", background: "#111114", border: "1px solid #27272e", borderRadius: "8px", color: "#71717a", textDecoration: "none", flexShrink: 0 }}>
          <ArrowLeft size={14} />
        </Link>
        <div>
          <h1 style={{ fontFamily: '"Sora", sans-serif', fontSize: "22px", fontWeight: 800, color: "#fafafa", letterSpacing: "-0.5px", marginBottom: "2px" }}>Optimization Settings</h1>
          <p style={{ fontSize: "13px", color: "#52525b" }}>Configure thresholds and behavior for the optimization engine.</p>
        </div>
      </div>

      {/* General */}
      <div style={{ ...S.card, padding: "20px 24px" }}>
        <div style={{ fontFamily: '"Sora", sans-serif', fontSize: "14px", fontWeight: 700, color: "#fafafa", marginBottom: "4px" }}>General</div>
        <div style={{ fontSize: "12px", color: "#52525b", marginBottom: "18px" }}>Enable or disable the optimization engine and run frequency.</div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #1a1a1f" }}>
          <div>
            <div style={S.label}>Enable Optimization</div>
            <div style={{ fontSize: "12px", color: "#52525b" }}>Allow the engine to analyze and suggest optimizations.</div>
          </div>
          <Toggle value={settings.isEnabled} onChange={() => setSettings({ ...settings, isEnabled: !settings.isEnabled })} />
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #1a1a1f" }}>
          <div>
            <div style={S.label}>Auto-Apply</div>
            <div style={{ fontSize: "12px", color: "#52525b" }}>Automatically apply approved actions without manual review.</div>
          </div>
          <Toggle value={settings.autoApply} onChange={() => setSettings({ ...settings, autoApply: !settings.autoApply })} />
        </div>

        <div style={{ padding: "14px 0" }}>
          <label style={S.label}>Run Frequency</label>
          <select value={settings.runFrequency} onChange={e => setSettings({ ...settings, runFrequency: e.target.value })}
            style={{ ...S.input, width: "200px", appearance: "none" as const, cursor: "pointer" }}>
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
            <option value="BIWEEKLY">Bi-Weekly</option>
            <option value="MONTHLY">Monthly</option>
          </select>
        </div>
      </div>

      {/* Thresholds */}
      <div style={{ ...S.card, padding: "20px 24px" }}>
        <div style={{ fontFamily: '"Sora", sans-serif', fontSize: "14px", fontWeight: 700, color: "#fafafa", marginBottom: "4px" }}>Thresholds</div>
        <div style={{ fontSize: "12px", color: "#52525b", marginBottom: "18px" }}>Minimum requirements and performance thresholds for optimization rules.</div>

        {[
          { label: "Minimum Impressions", hint: "Minimum impressions before an ad or keyword is evaluated.", field: "minImpressions" as keyof Settings, step: 1 },
          { label: "Low Performance Threshold", hint: "Ads below this CTR ratio will be flagged (e.g. 0.5 = 50% of campaign avg).", field: "lowPerformanceThreshold" as keyof Settings, step: 0.1 },
          { label: "High Performance Threshold (ROAS)", hint: "Campaigns exceeding 2× this ROAS will be considered for budget increase.", field: "highPerformanceThreshold" as keyof Settings, step: 0.1 },
        ].map((f, i) => (
          <div key={f.field} style={{ padding: "14px 0", borderBottom: "1px solid #1a1a1f" }}>
            <label style={S.label}>{f.label}</label>
            <span style={S.hint}>{f.hint}</span>
            <input type="number" step={f.step} value={settings[f.field] as number}
              onChange={e => setSettings({ ...settings, [f.field]: Number(e.target.value) })}
              style={S.input} />
          </div>
        ))}

        <div style={{ height: "1px", background: "#27272e", margin: "4px 0" }} />

        {[
          { label: "Max Budget Increase (%)", hint: "Maximum % to increase daily budget in a single optimization.", field: "maxBudgetIncrease" as keyof Settings },
          { label: "Max Budget Decrease (%)", hint: "Maximum % to decrease daily budget in a single optimization.", field: "maxBudgetDecrease" as keyof Settings },
        ].map(f => (
          <div key={f.field} style={{ padding: "14px 0", borderBottom: "1px solid #1a1a1f" }}>
            <label style={S.label}>{f.label}</label>
            <span style={S.hint}>{f.hint}</span>
            <input type="number" value={settings[f.field] as number}
              onChange={e => setSettings({ ...settings, [f.field]: Number(e.target.value) })}
              style={S.input} />
          </div>
        ))}
      </div>

      {/* Save */}
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "12px" }}>
        {saved && <span style={{ fontSize: "12px", color: "#34d399" }}>Settings saved successfully</span>}
        <button onClick={handleSave} disabled={saving} style={{ padding: "9px 20px", background: saving ? "rgba(249,115,22,0.5)" : "#f97316", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "7px" }}>
          {saved ? <><Check size={13} /> Saved</> : <><Save size={13} /> {saving ? "Saving..." : "Save Settings"}</>}
        </button>
      </div>
    </div>
  );
}
