"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, Rocket } from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/utils";

const S = {
  card: { background: "#111114", border: "1px solid #27272e", borderRadius: "12px" },
  input: { height: "40px", padding: "0 14px", background: "#18181c", border: "1px solid #27272e", borderRadius: "8px", color: "#fafafa", fontSize: "13px", outline: "none", width: "100%", boxSizing: "border-box" as const, fontFamily: "inherit" },
  label: { fontSize: "11px", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1px", color: "#3f3f46" },
};

const COMPETITION_COLOR: Record<string, string> = { HIGH: "#f87171", MEDIUM: "#fbbf24", LOW: "#34d399" };

const BUSINESS_TYPES = ["Restaurant", "Plumber", "Dentist", "Lawyer", "Real Estate", "Gym", "Auto Repair", "Salon", "HVAC"];

interface CityData {
  name: string; state: string; population: number; medianIncome: number;
  competitionLevel: string; topIndustries: string[]; avgCpcRange: [number, number];
}
interface GeneratedConfig {
  name: string; cityName: string; state: string; businessType: string;
  keywords: { text: string; matchType: string }[];
  adCopy: { headlines: string[]; descriptions: string[] };
  geoTargeting: { city: string; state: string; country: string; radiusMiles: number };
  suggestedBudget: { min: number; recommended: number; max: number };
  cityData: CityData;
}
interface CityCampaignRecord {
  id: string; cityName: string; state: string | null; businessType: string | null;
  status: string; researchData: CityData | null; generatedConfig: GeneratedConfig | null;
  createdAt: string;
  campaigns: { id: string; name: string; platform: string; status: string; spend: number }[];
}

export default function CityCampaignsPage() {
  const [cityCampaigns, setCityCampaigns] = useState<CityCampaignRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [cityInput, setCityInput] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [generatedResult, setGeneratedResult] = useState<CityCampaignRecord | null>(null);
  const [deploying, setDeploying] = useState<string | null>(null);

  useEffect(() => { fetchCityCampaigns(); }, []);

  async function fetchCityCampaigns() {
    try {
      const res = await fetch("/api/city-campaigns");
      if (res.ok) setCityCampaigns(await res.json());
    } catch { /* empty */ }
    setLoading(false);
  }

  async function handleGenerate() {
    if (!cityInput.trim() || !businessType) return;
    setGenerating(true);
    setGeneratedResult(null);
    try {
      const res = await fetch("/api/city-campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cityName: cityInput.trim(), businessType: businessType.toLowerCase() }),
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedResult(data);
        await fetchCityCampaigns();
      }
    } catch { /* handle */ }
    setGenerating(false);
  }

  async function handleDeploy(platform: "GOOGLE_ADS" | "META_ADS") {
    if (!generatedResult?.generatedConfig) return;
    setDeploying(platform);
    try {
      const config = generatedResult.generatedConfig;
      await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform, name: config.name,
          objective: platform === "GOOGLE_ADS" ? "SEARCH" : "OUTCOME_LEADS",
          dailyBudget: config.suggestedBudget.recommended,
          targetLocations: [`${config.geoTargeting.city}, ${config.geoTargeting.state}`],
        }),
      });
      await fetchCityCampaigns();
    } catch { /* handle */ }
    setDeploying(null);
  }

  const config = generatedResult?.generatedConfig;
  const research = generatedResult?.researchData || config?.cityData;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: '"Sora", sans-serif', fontSize: "22px", fontWeight: 800, color: "#fafafa", letterSpacing: "-0.5px", marginBottom: "3px" }}>City Campaign Builder</h1>
        <p style={{ fontSize: "13px", color: "#52525b" }}>Generate geo-targeted campaigns for any city. AI creates keywords, ad copy, and budget recommendations.</p>
      </div>

      {/* Generator Form */}
      <div style={{ ...S.card, padding: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
          <MapPin size={15} color="#f97316" />
          <span style={{ fontFamily: '"Sora", sans-serif', fontSize: "14px", fontWeight: 700, color: "#fafafa" }}>Generate Campaign</span>
        </div>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: 1, minWidth: "200px" }}>
            <div style={{ ...S.label, marginBottom: "6px" }}>City Name</div>
            <input value={cityInput} onChange={(e) => setCityInput(e.target.value)} placeholder="e.g., Mumbai, Delhi, Bangalore" style={S.input} onKeyDown={(e) => e.key === "Enter" && handleGenerate()} />
          </div>
          <div style={{ width: "180px" }}>
            <div style={{ ...S.label, marginBottom: "6px" }}>Business Type</div>
            <select value={businessType} onChange={(e) => setBusinessType(e.target.value)}
              style={{ ...S.input, appearance: "none" as const, cursor: "pointer" }}>
              <option value="">Select type...</option>
              {BUSINESS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <button onClick={handleGenerate} disabled={generating || !cityInput.trim() || !businessType}
            style={{ height: "40px", padding: "0 20px", background: (generating || !cityInput.trim() || !businessType) ? "rgba(249,115,22,0.4)" : "#f97316", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: (generating || !cityInput.trim() || !businessType) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "7px", whiteSpace: "nowrap" as const }}>
            <Rocket size={13} /> {generating ? "Generating..." : "Generate"}
          </button>
        </div>
      </div>

      {/* Research Data */}
      {research && (
        <div style={{ ...S.card, padding: "20px 24px" }}>
          <div style={{ fontFamily: '"Sora", sans-serif', fontSize: "14px", fontWeight: 700, color: "#fafafa", marginBottom: "4px" }}>City Research: {research.name}, {research.state}</div>
          <div style={{ fontSize: "12px", color: "#52525b", marginBottom: "16px" }}>Market data for campaign planning</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "14px" }}>
            {[
              { label: "Population", value: formatNumber(research.population) },
              { label: "Median Income", value: formatCurrency(research.medianIncome) },
              { label: "Avg CPC Range", value: `${formatCurrency(research.avgCpcRange[0])}–${formatCurrency(research.avgCpcRange[1])}` },
            ].map(item => (
              <div key={item.label} style={{ background: "#0d0d10", borderRadius: "8px", padding: "12px 14px" }}>
                <div style={{ ...S.label, marginBottom: "4px" }}>{item.label}</div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "#fafafa" }}>{item.value}</div>
              </div>
            ))}
            <div style={{ background: "#0d0d10", borderRadius: "8px", padding: "12px 14px" }}>
              <div style={{ ...S.label, marginBottom: "4px" }}>Competition</div>
              <span style={{ padding: "3px 10px", borderRadius: "5px", fontSize: "11px", fontWeight: 700, background: `${COMPETITION_COLOR[research.competitionLevel] || "#3f3f46"}18`, color: COMPETITION_COLOR[research.competitionLevel] || "#71717a" }}>
                {research.competitionLevel}
              </span>
            </div>
          </div>
          <div style={{ ...S.label, marginBottom: "8px" }}>Top Industries</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {research.topIndustries.map(i => (
              <span key={i} style={{ padding: "3px 10px", borderRadius: "5px", fontSize: "11.5px", background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)", color: "#fb923c" }}>{i}</span>
            ))}
          </div>
        </div>
      )}

      {/* Generated Config */}
      {config && (
        <div style={{ ...S.card, padding: "20px 24px" }}>
          <div style={{ fontFamily: '"Sora", sans-serif', fontSize: "14px", fontWeight: 700, color: "#fafafa", marginBottom: "4px" }}>Generated: {config.name}</div>
          <div style={{ fontSize: "12px", color: "#52525b", marginBottom: "20px" }}>Review the configuration before deploying to your ad platforms.</div>

          {/* Budget */}
          <div style={{ marginBottom: "20px" }}>
            <div style={{ ...S.label, marginBottom: "10px" }}>Suggested Daily Budget</div>
            <div style={{ display: "flex", gap: "10px" }}>
              {[
                { label: "Min", value: formatCurrency(config.suggestedBudget.min), highlight: false },
                { label: "Recommended", value: formatCurrency(config.suggestedBudget.recommended), highlight: true },
                { label: "Max", value: formatCurrency(config.suggestedBudget.max), highlight: false },
              ].map(b => (
                <div key={b.label} style={{ flex: 1, padding: "12px", background: b.highlight ? "rgba(249,115,22,0.06)" : "#0d0d10", border: `1px solid ${b.highlight ? "rgba(249,115,22,0.3)" : "#1a1a1f"}`, borderRadius: "8px", textAlign: "center" }}>
                  <div style={{ ...S.label, marginBottom: "4px" }}>{b.label}</div>
                  <div style={{ fontSize: b.highlight ? "18px" : "15px", fontWeight: 700, color: b.highlight ? "#f97316" : "#fafafa" }}>{b.value}/day</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ height: "1px", background: "#1a1a1f", margin: "16px 0" }} />

          {/* Keywords */}
          <div style={{ marginBottom: "20px" }}>
            <div style={{ ...S.label, marginBottom: "10px" }}>Keywords ({config.keywords.length})</div>
            <div style={{ maxHeight: "180px", overflowY: "auto", background: "#0d0d10", borderRadius: "8px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #1a1a1f" }}>
                    <th style={{ padding: "8px 14px", textAlign: "left", ...S.label }}>Keyword</th>
                    <th style={{ padding: "8px 14px", textAlign: "left", ...S.label }}>Match</th>
                  </tr>
                </thead>
                <tbody>
                  {config.keywords.map((kw, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #1a1a1f" }}>
                      <td style={{ padding: "7px 14px", color: "#a1a1aa" }}>{kw.text}</td>
                      <td style={{ padding: "7px 14px" }}>
                        <span style={{ padding: "2px 7px", borderRadius: "4px", fontSize: "10px", fontWeight: 700, background: "rgba(249,115,22,0.08)", color: "#fb923c" }}>{kw.matchType}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ height: "1px", background: "#1a1a1f", margin: "16px 0" }} />

          {/* Ad Copy */}
          <div style={{ marginBottom: "20px" }}>
            <div style={{ ...S.label, marginBottom: "10px" }}>Ad Copy</div>
            <div style={{ marginBottom: "12px" }}>
              <div style={{ fontSize: "11.5px", color: "#52525b", marginBottom: "8px" }}>Headlines</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {config.adCopy.headlines.map((h, i) => (
                  <span key={i} style={{ padding: "3px 10px", borderRadius: "5px", fontSize: "12px", background: "#18181c", border: "1px solid #27272e", color: "#a1a1aa" }}>{h}</span>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "11.5px", color: "#52525b", marginBottom: "8px" }}>Descriptions</div>
              {config.adCopy.descriptions.map((d, i) => (
                <div key={i} style={{ fontSize: "12.5px", color: "#71717a", marginBottom: "4px", paddingLeft: "10px", borderLeft: "2px solid #27272e" }}>{d}</div>
              ))}
            </div>
          </div>

          <div style={{ height: "1px", background: "#1a1a1f", margin: "16px 0" }} />

          {/* Geo */}
          <div style={{ marginBottom: "20px" }}>
            <div style={{ ...S.label, marginBottom: "6px" }}>Geo Targeting</div>
            <div style={{ fontSize: "13px", color: "#a1a1aa" }}>
              {config.geoTargeting.city}, {config.geoTargeting.state} · {config.geoTargeting.radiusMiles} mile radius
            </div>
          </div>

          {/* Deploy Buttons */}
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={() => handleDeploy("GOOGLE_ADS")} disabled={deploying === "GOOGLE_ADS"}
              style={{ padding: "9px 18px", background: deploying === "GOOGLE_ADS" ? "rgba(66,133,244,0.4)" : "rgba(66,133,244,0.1)", border: "1px solid rgba(66,133,244,0.4)", borderRadius: "8px", color: "#4285F4", fontSize: "13px", fontWeight: 600, cursor: deploying === "GOOGLE_ADS" ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
              <Rocket size={13} /> {deploying === "GOOGLE_ADS" ? "Deploying..." : "Deploy to Google Ads"}
            </button>
            <button onClick={() => handleDeploy("META_ADS")} disabled={deploying === "META_ADS"}
              style={{ padding: "9px 18px", background: deploying === "META_ADS" ? "rgba(24,119,242,0.4)" : "rgba(24,119,242,0.1)", border: "1px solid rgba(24,119,242,0.4)", borderRadius: "8px", color: "#1877F2", fontSize: "13px", fontWeight: 600, cursor: deploying === "META_ADS" ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
              <Rocket size={13} /> {deploying === "META_ADS" ? "Deploying..." : "Deploy to Meta Ads"}
            </button>
          </div>
        </div>
      )}

      {/* Existing City Campaigns */}
      <div style={{ ...S.card, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #27272e" }}>
          <span style={{ fontFamily: '"Sora", sans-serif', fontSize: "14px", fontWeight: 700, color: "#fafafa" }}>City Campaigns</span>
          <span style={{ fontSize: "11px", color: "#3f3f46", marginLeft: "8px" }}>Previously generated configurations</span>
        </div>
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#3f3f46", fontSize: "13px" }}>Loading...</div>
        ) : cityCampaigns.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#3f3f46", fontSize: "13px" }}>No city campaigns yet. Generate one above.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #1a1a1f" }}>
                {["City", "Business Type", "Status", "Campaigns", "Created"].map(h => (
                  <th key={h} style={{ padding: "10px 20px", textAlign: "left", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#3f3f46" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cityCampaigns.map((cc) => (
                <tr key={cc.id} style={{ borderBottom: "1px solid #1a1a1f" }}>
                  <td style={{ padding: "12px 20px" }}>
                    <Link href={`/city-campaigns/${cc.id}`} style={{ color: "#fafafa", fontWeight: 500, textDecoration: "none" }}>
                      {cc.cityName}{cc.state ? `, ${cc.state}` : ""}
                    </Link>
                  </td>
                  <td style={{ padding: "12px 20px", color: "#71717a" }}>{cc.businessType || "—"}</td>
                  <td style={{ padding: "12px 20px" }}>
                    <span style={{ padding: "2px 8px", borderRadius: "5px", fontSize: "10.5px", fontWeight: 700, background: cc.status === "ACTIVE" ? "rgba(52,211,153,0.1)" : "rgba(113,113,122,0.1)", color: cc.status === "ACTIVE" ? "#34d399" : "#71717a" }}>
                      {cc.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px 20px", color: "#71717a" }}>{cc.campaigns.length}</td>
                  <td style={{ padding: "12px 20px", color: "#52525b" }}>{new Date(cc.createdAt).toLocaleDateString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
