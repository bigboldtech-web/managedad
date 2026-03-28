"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Eye, MousePointerClick, Target, TrendingUp, Pause, Play, Loader2,
} from "lucide-react";
import { formatCurrency, formatNumber, formatPercent, formatCompactNumber } from "@/lib/utils";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const S = {
  card: { background: "#111114", border: "1px solid #27272e", borderRadius: "12px" },
  mono: { fontFamily: "var(--font-ibm-plex-mono), monospace" },
  th: { padding: "10px 14px", fontSize: "10px", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1px", color: "#3f3f46", borderBottom: "1px solid #27272e" },
};

interface CampaignDetail {
  id: string;
  name: string;
  platform: "GOOGLE_ADS" | "META_ADS";
  status: string;
  objective: string | null;
  dailyBudget: number;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
  createdAt: string;
  ads: {
    id: string; name: string | null; type: string; status: string;
    impressions: number; clicks: number; conversions: number; spend: number;
  }[];
  keywords: {
    id: string; text: string; matchType: string; status: string;
    qualityScore: number | null; impressions: number; clicks: number;
    conversions: number; spend: number;
  }[];
  dailyMetrics: {
    date: string; impressions: number; clicks: number; spend: number; conversions: number;
  }[];
}

// Demo campaign used when API returns nothing
function buildDemoCampaign(id: string): CampaignDetail {
  return {
    id, name: "Brand Awareness — Q1 2025", platform: "GOOGLE_ADS", status: "ACTIVE",
    objective: "SALES", dailyBudget: 5000, impressions: 412800, clicks: 18340,
    conversions: 284, spend: 97500, revenue: 428000, createdAt: new Date().toISOString(),
    ads: [
      { id: "a1", name: "Responsive Search Ad — Main", type: "RESPONSIVE_SEARCH_AD", status: "ACTIVE", impressions: 210000, clicks: 9800, conversions: 148, spend: 52000 },
      { id: "a2", name: "Responsive Search Ad — Promo", type: "RESPONSIVE_SEARCH_AD", status: "ACTIVE", impressions: 140000, clicks: 6200, conversions: 96, spend: 31000 },
      { id: "a3", name: "Display Banner 300x250", type: "DISPLAY_AD", status: "PAUSED", impressions: 62800, clicks: 2340, conversions: 40, spend: 14500 },
    ],
    keywords: [
      { id: "k1", text: "buy laptop online india", matchType: "EXACT", status: "ACTIVE", qualityScore: 9, impressions: 24800, clicks: 1840, conversions: 87, spend: 52000 },
      { id: "k2", text: "best laptop under 50000", matchType: "PHRASE", status: "ACTIVE", qualityScore: 7, impressions: 18200, clicks: 1120, conversions: 62, spend: 38000 },
      { id: "k3", text: "gaming laptop india", matchType: "BROAD", status: "ACTIVE", qualityScore: 5, impressions: 31400, clicks: 890, conversions: 21, spend: 29000 },
      { id: "k4", text: "laptop emi no interest", matchType: "EXACT", status: "ACTIVE", qualityScore: 8, impressions: 8900, clicks: 620, conversions: 48, spend: 17000 },
    ],
    dailyMetrics: Array.from({ length: 14 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - 13 + i);
      return { date: d.toISOString().split("T")[0], impressions: 28000 + Math.random() * 8000, clicks: 1200 + Math.random() * 400, spend: 6500 + Math.random() * 2000, conversions: 18 + Math.random() * 10 };
    }),
  };
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#18181c", border: "1px solid #27272e", borderRadius: "8px", padding: "10px 14px" }}>
      <div style={{ fontSize: "11px", color: "#71717a", marginBottom: "6px" }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ fontSize: "12px", color: p.color, marginBottom: "2px" }}>
          {p.name}: <span style={{ fontWeight: 600 }}>{p.name === "Spend" ? formatCurrency(p.value) : p.value.toLocaleString("en-IN")}</span>
        </div>
      ))}
    </div>
  );
};

const matchTypeColor: Record<string, { bg: string; color: string }> = {
  EXACT: { bg: "rgba(52,211,153,0.08)", color: "#34d399" },
  PHRASE: { bg: "rgba(251,191,36,0.08)", color: "#fbbf24" },
  BROAD: { bg: "rgba(113,113,122,0.1)", color: "#71717a" },
};

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  const campaignId = params.id as string;

  useEffect(() => {
    async function fetchCampaign() {
      try {
        const res = await fetch(`/api/campaigns?id=${campaignId}`);
        if (res.ok) { setCampaign(await res.json()); setLoading(false); return; }
      } catch {}
      setCampaign(buildDemoCampaign(campaignId));
      setLoading(false);
    }
    fetchCampaign();
  }, [campaignId]);

  async function handleStatusChange(newStatus: string) {
    setToggling(true);
    try {
      const res = await fetch(`/api/campaigns?id=${campaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setCampaign((prev) => prev ? { ...prev, status: updated.status } : prev);
      } else {
        setCampaign((prev) => prev ? { ...prev, status: newStatus } : prev);
      }
    } catch {
      setCampaign((prev) => prev ? { ...prev, status: newStatus } : prev);
    }
    setToggling(false);
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px" }}>
        <Loader2 size={24} style={{ color: "#3f3f46", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px", gap: "16px" }}>
        <div style={{ fontFamily: '"Sora", sans-serif', fontSize: "18px", fontWeight: 700, color: "#fafafa" }}>Campaign not found</div>
        <Link href="/campaigns" style={{ textDecoration: "none" }}>
          <button style={{ padding: "8px 18px", background: "transparent", border: "1px solid #27272e", borderRadius: "8px", color: "#a1a1aa", fontSize: "13px", cursor: "pointer" }}>← Back to Campaigns</button>
        </Link>
      </div>
    );
  }

  const ctr = Number(campaign.impressions) > 0 ? (Number(campaign.clicks) / Number(campaign.impressions)) * 100 : 0;
  const roas = Number(campaign.spend) > 0 ? Number(campaign.revenue) / Number(campaign.spend) : 0;
  const cpa = Number(campaign.conversions) > 0 ? Number(campaign.spend) / Number(campaign.conversions) : 0;
  const isGoogle = campaign.platform === "GOOGLE_ADS";
  const platformColor = isGoogle ? "#4285F4" : "#1877F2";

  const kpis = [
    { label: "Impressions", value: formatCompactNumber(Number(campaign.impressions)), icon: Eye },
    { label: "Clicks", value: formatCompactNumber(Number(campaign.clicks)), icon: MousePointerClick },
    { label: "CTR", value: formatPercent(ctr), icon: TrendingUp },
    { label: "Conversions", value: formatNumber(campaign.conversions), icon: Target },
    { label: "Spend", value: formatCurrency(Number(campaign.spend)), icon: Target },
    { label: "CPA", value: cpa > 0 ? formatCurrency(cpa) : "—", icon: Target },
    { label: "Revenue", value: formatCurrency(Number(campaign.revenue)), icon: TrendingUp },
    { label: "ROAS", value: roas > 0 ? `${roas.toFixed(2)}x` : "—", icon: TrendingUp },
  ];

  const chartData = (campaign.dailyMetrics || []).map((m) => ({
    date: (() => { const d = new Date(m.date); return `${d.getDate()}/${d.getMonth()+1}`; })(),
    Impressions: Math.round(Number(m.impressions)),
    Clicks: Math.round(Number(m.clicks)),
    Spend: Number(m.spend),
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
          <button onClick={() => router.back()} style={{ marginTop: "2px", padding: "6px", background: "transparent", border: "1px solid #27272e", borderRadius: "7px", cursor: "pointer", display: "flex", alignItems: "center", color: "#71717a" }}>
            <ArrowLeft size={14} />
          </button>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "5px", flexWrap: "wrap" }}>
              <h1 style={{ fontFamily: '"Sora", sans-serif', fontSize: "20px", fontWeight: 800, color: "#fafafa", letterSpacing: "-0.5px" }}>{campaign.name}</h1>
              <span style={{ padding: "2px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: 700, background: `${platformColor}18`, color: platformColor }}>
                {isGoogle ? "Google Ads" : "Meta Ads"}
              </span>
              <span style={{ padding: "2px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: 700, background: campaign.status === "ACTIVE" ? "rgba(52,211,153,0.08)" : "rgba(113,113,122,0.1)", color: campaign.status === "ACTIVE" ? "#34d399" : "#71717a" }}>
                {campaign.status}
              </span>
            </div>
            <div style={{ fontSize: "12.5px", color: "#52525b" }}>
              {campaign.objective && <span>{campaign.objective} · </span>}
              Budget: {formatCurrency(Number(campaign.dailyBudget))}/day
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {campaign.status === "ACTIVE" ? (
            <button onClick={() => handleStatusChange("PAUSED")} disabled={toggling} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 14px", background: "transparent", border: "1px solid #27272e", borderRadius: "8px", color: "#71717a", fontSize: "12.5px", cursor: toggling ? "not-allowed" : "pointer" }}>
              <Pause size={12} /> Pause
            </button>
          ) : (
            <button onClick={() => handleStatusChange("ACTIVE")} disabled={toggling} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 14px", background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.3)", borderRadius: "8px", color: "#34d399", fontSize: "12.5px", cursor: toggling ? "not-allowed" : "pointer" }}>
              <Play size={12} /> Activate
            </button>
          )}
        </div>
      </div>

      {/* KPI Strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
        {kpis.map((kpi) => (
          <div key={kpi.label} style={{ ...S.card, padding: "16px 18px" }}>
            <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#3f3f46", marginBottom: "6px" }}>{kpi.label}</div>
            <div style={{ ...S.mono, fontFamily: '"Sora", sans-serif', fontSize: "20px", fontWeight: 800, color: "#fafafa", letterSpacing: "-0.5px" }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Performance Chart */}
      <div style={{ ...S.card, padding: "20px 22px" }}>
        <div style={{ fontFamily: '"Sora", sans-serif', fontSize: "14px", fontWeight: 700, color: "#fafafa", marginBottom: "16px" }}>Daily Performance</div>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f25" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#3f3f46" }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "#3f3f46" }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: "#3f3f46" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: "11px", color: "#52525b" }} />
              <Line yAxisId="left" type="monotone" dataKey="Impressions" stroke="#818cf8" strokeWidth={2} dot={false} />
              <Line yAxisId="left" type="monotone" dataKey="Clicks" stroke={platformColor} strokeWidth={2} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="Spend" stroke="#34d399" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ padding: "40px", textAlign: "center", fontSize: "13px", color: "#52525b" }}>No performance data available yet.</div>
        )}
      </div>

      {/* Ads Table */}
      <div style={{ ...S.card, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #27272e" }}>
          <span style={{ fontFamily: '"Sora", sans-serif', fontSize: "14px", fontWeight: 700, color: "#fafafa" }}>Ads</span>
          <span style={{ fontSize: "12px", color: "#52525b", marginLeft: "8px" }}>{(campaign.ads || []).length} ads</span>
        </div>
        {(campaign.ads || []).length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", fontSize: "13px", color: "#52525b" }}>No ads in this campaign yet.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Ad Name", "Type", "Status", "Impressions", "Clicks", "Conv.", "Spend"].map((h, i) => (
                    <th key={h} style={{ ...S.th, textAlign: i > 2 ? "right" : "left" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {campaign.ads.map((ad) => (
                  <tr key={ad.id}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#18181c")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    style={{ transition: "background 0.1s" }}>
                    <td style={{ padding: "12px 14px", fontSize: "12.5px", color: "#e4e4e7", fontWeight: 500, borderBottom: "1px solid #1a1a1f" }}>{ad.name || "Untitled Ad"}</td>
                    <td style={{ padding: "12px 14px", borderBottom: "1px solid #1a1a1f" }}>
                      <span style={{ padding: "2px 7px", borderRadius: "4px", fontSize: "10px", fontWeight: 600, background: "rgba(129,140,248,0.08)", color: "#818cf8" }}>{ad.type.replace(/_/g, " ")}</span>
                    </td>
                    <td style={{ padding: "12px 14px", borderBottom: "1px solid #1a1a1f" }}>
                      <span style={{ padding: "2px 7px", borderRadius: "4px", fontSize: "10px", fontWeight: 600, background: ad.status === "ACTIVE" ? "rgba(52,211,153,0.08)" : "rgba(113,113,122,0.1)", color: ad.status === "ACTIVE" ? "#34d399" : "#71717a" }}>{ad.status}</span>
                    </td>
                    <td style={{ padding: "12px 14px", textAlign: "right", fontSize: "12.5px", color: "#a1a1aa", borderBottom: "1px solid #1a1a1f", ...S.mono }}>{formatNumber(Number(ad.impressions))}</td>
                    <td style={{ padding: "12px 14px", textAlign: "right", fontSize: "12.5px", color: "#a1a1aa", borderBottom: "1px solid #1a1a1f", ...S.mono }}>{formatNumber(Number(ad.clicks))}</td>
                    <td style={{ padding: "12px 14px", textAlign: "right", fontSize: "12.5px", color: "#a1a1aa", borderBottom: "1px solid #1a1a1f", ...S.mono }}>{ad.conversions}</td>
                    <td style={{ padding: "12px 14px", textAlign: "right", fontSize: "12.5px", color: "#fafafa", fontWeight: 600, borderBottom: "1px solid #1a1a1f", ...S.mono }}>{formatCurrency(Number(ad.spend))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Keywords (Google only) */}
      {isGoogle && (
        <div style={{ ...S.card, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #27272e" }}>
            <span style={{ fontFamily: '"Sora", sans-serif', fontSize: "14px", fontWeight: 700, color: "#fafafa" }}>Keywords</span>
            <span style={{ fontSize: "12px", color: "#52525b", marginLeft: "8px" }}>{(campaign.keywords || []).length} keywords</span>
          </div>
          {(campaign.keywords || []).length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", fontSize: "13px", color: "#52525b" }}>No keywords in this campaign yet.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Keyword", "Match", "Status", "QS", "Impressions", "Clicks", "Conv.", "Spend"].map((h, i) => (
                      <th key={h} style={{ ...S.th, textAlign: i > 2 ? "right" : "left" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {campaign.keywords.map((kw) => {
                    const mc = matchTypeColor[kw.matchType] || { bg: "rgba(113,113,122,0.1)", color: "#71717a" };
                    const qs = kw.qualityScore;
                    const qsColor = qs === null ? "#52525b" : qs >= 7 ? "#34d399" : qs >= 5 ? "#fbbf24" : "#f87171";
                    return (
                      <tr key={kw.id}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#18181c")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        style={{ transition: "background 0.1s" }}>
                        <td style={{ padding: "12px 14px", fontSize: "12.5px", color: "#e4e4e7", fontWeight: 500, borderBottom: "1px solid #1a1a1f", ...S.mono }}>{kw.text}</td>
                        <td style={{ padding: "12px 14px", borderBottom: "1px solid #1a1a1f" }}>
                          <span style={{ padding: "2px 7px", borderRadius: "4px", fontSize: "10px", fontWeight: 700, ...mc }}>{kw.matchType}</span>
                        </td>
                        <td style={{ padding: "12px 14px", borderBottom: "1px solid #1a1a1f" }}>
                          <span style={{ padding: "2px 7px", borderRadius: "4px", fontSize: "10px", fontWeight: 600, background: kw.status === "ACTIVE" ? "rgba(52,211,153,0.08)" : "rgba(113,113,122,0.1)", color: kw.status === "ACTIVE" ? "#34d399" : "#71717a" }}>{kw.status}</span>
                        </td>
                        <td style={{ padding: "12px 14px", textAlign: "right", borderBottom: "1px solid #1a1a1f" }}>
                          <span style={{ fontSize: "13px", fontWeight: 700, color: qsColor }}>{qs ?? "—"}</span>
                          {qs !== null && <span style={{ fontSize: "10px", color: "#3f3f46" }}>/10</span>}
                        </td>
                        <td style={{ padding: "12px 14px", textAlign: "right", fontSize: "12.5px", color: "#a1a1aa", borderBottom: "1px solid #1a1a1f", ...S.mono }}>{formatNumber(Number(kw.impressions))}</td>
                        <td style={{ padding: "12px 14px", textAlign: "right", fontSize: "12.5px", color: "#a1a1aa", borderBottom: "1px solid #1a1a1f", ...S.mono }}>{formatNumber(Number(kw.clicks))}</td>
                        <td style={{ padding: "12px 14px", textAlign: "right", fontSize: "12.5px", color: "#a1a1aa", borderBottom: "1px solid #1a1a1f", ...S.mono }}>{kw.conversions}</td>
                        <td style={{ padding: "12px 14px", textAlign: "right", fontSize: "12.5px", color: "#fafafa", fontWeight: 600, borderBottom: "1px solid #1a1a1f", ...S.mono }}>{formatCurrency(Number(kw.spend))}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
