"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/utils";

const S = {
  card: { background: "#111114", border: "1px solid #27272e", borderRadius: "12px" },
  label: { fontSize: "10px", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1px", color: "#3f3f46" },
};

const COMPETITION_COLOR: Record<string, string> = { HIGH: "#f87171", MEDIUM: "#fbbf24", LOW: "#34d399" };

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
interface CityCampaignDetail {
  id: string; cityName: string; state: string | null; businessType: string | null;
  status: string; researchData: CityData | null; generatedConfig: GeneratedConfig | null;
  createdAt: string;
  campaigns: { id: string; name: string; platform: string; status: string; spend: number }[];
}

export default function CityCampaignDetailPage() {
  const params = useParams();
  const [cityCampaign, setCityCampaign] = useState<CityCampaignDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const id = params.id as string;

  useEffect(() => {
    async function fetchDetail() {
      try {
        const res = await fetch(`/api/city-campaigns?id=${id}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setCityCampaign(data.find((c: CityCampaignDetail) => c.id === id) || null);
          } else {
            setCityCampaign(data);
          }
        }
      } catch { /* handle */ }
      setLoading(false);
    }
    fetchDetail();
  }, [id]);

  if (loading) {
    return <div style={{ padding: "60px", textAlign: "center", color: "#3f3f46", fontSize: "13px" }}>Loading...</div>;
  }

  if (!cityCampaign) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px", gap: "16px" }}>
        <div style={{ fontSize: "16px", fontWeight: 600, color: "#fafafa" }}>City campaign not found</div>
        <Link href="/city-campaigns" style={{ padding: "8px 16px", background: "transparent", border: "1px solid #27272e", borderRadius: "8px", color: "#a1a1aa", fontSize: "13px", textDecoration: "none" }}>
          ← Back to City Campaigns
        </Link>
      </div>
    );
  }

  const config = cityCampaign.generatedConfig;
  const research = cityCampaign.researchData || config?.cityData;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <Link href="/city-campaigns" style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", background: "#111114", border: "1px solid #27272e", borderRadius: "8px", color: "#71717a", textDecoration: "none", flexShrink: 0 }}>
          <ArrowLeft size={14} />
        </Link>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <MapPin size={15} color="#f97316" />
            <h1 style={{ fontFamily: '"Sora", sans-serif', fontSize: "22px", fontWeight: 800, color: "#fafafa", letterSpacing: "-0.5px", margin: 0 }}>
              {cityCampaign.cityName}{cityCampaign.state ? `, ${cityCampaign.state}` : ""}
            </h1>
            <span style={{ padding: "2px 8px", borderRadius: "5px", fontSize: "10.5px", fontWeight: 700, background: cityCampaign.status === "ACTIVE" ? "rgba(52,211,153,0.1)" : "rgba(113,113,122,0.1)", color: cityCampaign.status === "ACTIVE" ? "#34d399" : "#71717a" }}>
              {cityCampaign.status}
            </span>
          </div>
          <p style={{ fontSize: "12px", color: "#52525b", margin: "3px 0 0" }}>
            {cityCampaign.businessType || "General"} campaign · Created {new Date(cityCampaign.createdAt).toLocaleDateString("en-IN")}
          </p>
        </div>
      </div>

      {/* Research Data */}
      {research && (
        <div style={{ ...S.card, padding: "20px 24px" }}>
          <div style={{ fontFamily: '"Sora", sans-serif', fontSize: "14px", fontWeight: 700, color: "#fafafa", marginBottom: "14px" }}>City Research Data</div>
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
              <div style={{ ...S.label, marginBottom: "6px" }}>Competition</div>
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

      {/* Config */}
      {config && (
        <div style={{ ...S.card, padding: "20px 24px" }}>
          <div style={{ fontFamily: '"Sora", sans-serif', fontSize: "14px", fontWeight: 700, color: "#fafafa", marginBottom: "4px" }}>Campaign Configuration</div>
          <div style={{ fontSize: "12px", color: "#52525b", marginBottom: "20px" }}>{config.name}</div>

          <div style={{ marginBottom: "16px" }}>
            <div style={{ ...S.label, marginBottom: "6px" }}>Geo Targeting</div>
            <div style={{ fontSize: "13px", color: "#a1a1aa" }}>{config.geoTargeting.city}, {config.geoTargeting.state} · {config.geoTargeting.radiusMiles} mile radius</div>
          </div>

          <div style={{ height: "1px", background: "#1a1a1f", margin: "16px 0" }} />

          <div style={{ marginBottom: "16px" }}>
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

          <div style={{ marginBottom: "16px" }}>
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

          <div>
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
        </div>
      )}

      {/* Deployed Campaigns */}
      <div style={{ ...S.card, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #27272e" }}>
          <span style={{ fontFamily: '"Sora", sans-serif', fontSize: "14px", fontWeight: 700, color: "#fafafa" }}>Deployed Campaigns</span>
          <span style={{ fontSize: "11px", color: "#3f3f46", marginLeft: "8px" }}>{cityCampaign.campaigns.length} campaign{cityCampaign.campaigns.length !== 1 ? "s" : ""}</span>
        </div>
        {cityCampaign.campaigns.length === 0 ? (
          <div style={{ padding: "32px", textAlign: "center", color: "#3f3f46", fontSize: "13px" }}>No campaigns deployed from this configuration yet.</div>
        ) : (
          cityCampaign.campaigns.map((c) => (
            <div key={c.id} style={{ padding: "14px 20px", borderBottom: "1px solid #1a1a1f", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <Link href={`/campaigns/${c.id}`} style={{ fontSize: "13.5px", fontWeight: 600, color: "#fafafa", textDecoration: "none" }}>{c.name}</Link>
                <div style={{ display: "flex", gap: "6px", marginTop: "5px" }}>
                  <span style={{ padding: "2px 7px", borderRadius: "4px", fontSize: "10px", fontWeight: 700, background: c.platform === "GOOGLE_ADS" ? "rgba(66,133,244,0.1)" : "rgba(24,119,242,0.1)", color: c.platform === "GOOGLE_ADS" ? "#4285F4" : "#1877F2" }}>
                    {c.platform === "GOOGLE_ADS" ? "Google" : "Meta"}
                  </span>
                  <span style={{ padding: "2px 7px", borderRadius: "4px", fontSize: "10px", fontWeight: 700, background: c.status === "ACTIVE" ? "rgba(52,211,153,0.1)" : "rgba(113,113,122,0.1)", color: c.status === "ACTIVE" ? "#34d399" : "#71717a" }}>
                    {c.status}
                  </span>
                </div>
              </div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#fafafa" }}>{formatCurrency(Number(c.spend))} spent</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
