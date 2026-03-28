"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, Filter } from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/utils";

interface Campaign {
  id: string;
  name: string;
  platform: "GOOGLE_ADS" | "META_ADS";
  status: string;
  dailyBudget: number;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
}

type PlatformFilter = "ALL" | "GOOGLE_ADS" | "META_ADS";
type StatusFilter = "ALL" | "ACTIVE" | "PAUSED" | "DRAFT" | "ENDED";

const S = {
  card: { background: "#111114", border: "1px solid #27272e", borderRadius: "12px" },
  th: { padding: "10px 14px", fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1px", color: "#3f3f46", borderBottom: "1px solid #27272e" },
  td: { padding: "13px 14px", fontSize: "13px", color: "#a1a1aa", borderBottom: "1px solid #1a1a1f" },
  mono: { fontFamily: "var(--font-ibm-plex-mono), monospace" },
};

const demoCampaigns: Campaign[] = [
  { id: "1", name: "Brand Awareness — India", platform: "GOOGLE_ADS", status: "ACTIVE", dailyBudget: 5000, impressions: 245000, clicks: 8200, conversions: 312, spend: 142000, revenue: 682000 },
  { id: "2", name: "Lead Gen — Tier 1 Cities", platform: "META_ADS", status: "ACTIVE", dailyBudget: 3500, impressions: 187000, clicks: 5900, conversions: 198, spend: 98000, revenue: 412000 },
  { id: "3", name: "Product Launch Q2", platform: "GOOGLE_ADS", status: "ACTIVE", dailyBudget: 8000, impressions: 312000, clicks: 11400, conversions: 445, spend: 218000, revenue: 960000 },
  { id: "4", name: "Retargeting — Website Visitors", platform: "META_ADS", status: "ACTIVE", dailyBudget: 2000, impressions: 92000, clicks: 4100, conversions: 287, spend: 62000, revenue: 389000 },
  { id: "5", name: "Search — Competitor Keywords", platform: "GOOGLE_ADS", status: "PAUSED", dailyBudget: 4000, impressions: 68000, clicks: 1900, conversions: 54, spend: 78000, revenue: 198000 },
  { id: "6", name: "Video — Brand Story", platform: "META_ADS", status: "ACTIVE", dailyBudget: 2500, impressions: 420000, clicks: 3200, conversions: 89, spend: 72000, revenue: 256000 },
];

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(demoCampaigns);
  const [loading, setLoading] = useState(false);
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchCampaigns() {
      try {
        const res = await fetch("/api/campaigns");
        if (res.ok) {
          const data = await res.json();
          if (data.length) setCampaigns(data);
        }
      } catch { /* use demo data */ }
      setLoading(false);
    }
    fetchCampaigns();
  }, []);

  const filtered = campaigns.filter((c) => {
    if (platformFilter !== "ALL" && c.platform !== platformFilter) return false;
    if (statusFilter !== "ALL" && c.status !== statusFilter) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const getRoas = (c: Campaign) => Number(c.spend) === 0 ? 0 : Number(c.revenue) / Number(c.spend);

  const totalSpend = filtered.reduce((s, c) => s + Number(c.spend), 0);
  const totalConversions = filtered.reduce((s, c) => s + Number(c.conversions), 0);
  const totalRevenue = filtered.reduce((s, c) => s + Number(c.revenue), 0);
  const avgRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontFamily: '"Sora", sans-serif', fontSize: "22px", fontWeight: 800, color: "#fafafa", letterSpacing: "-0.5px", marginBottom: "3px" }}>
            Campaigns
          </h1>
          <p style={{ fontSize: "13px", color: "#52525b" }}>Manage all campaigns across Google Ads and Meta Ads.</p>
        </div>
        <Link href="/campaigns/new" style={{ textDecoration: "none" }}>
          <button style={{ display: "flex", alignItems: "center", gap: "7px", padding: "9px 16px", background: "#f97316", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
            <Plus size={14} /> New Campaign
          </button>
        </Link>
      </div>

      {/* KPI strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
        {[
          { label: "Total Spend", value: formatCurrency(totalSpend) },
          { label: "Conversions", value: formatNumber(totalConversions) },
          { label: "Revenue", value: formatCurrency(totalRevenue) },
          { label: "Avg. ROAS", value: `${avgRoas.toFixed(1)}x` },
        ].map((kpi) => (
          <div key={kpi.label} style={{ ...S.card, padding: "16px 18px" }}>
            <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#3f3f46", marginBottom: "6px" }}>{kpi.label}</div>
            <div style={{ ...S.mono, fontFamily: '"Sora", sans-serif', fontSize: "20px", fontWeight: 800, color: "#fafafa", letterSpacing: "-0.5px" }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ ...S.card, padding: "14px 16px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px" }}>
        <Filter size={13} color="#3f3f46" />
        <div style={{ display: "flex", gap: "6px" }}>
          {(["ALL", "GOOGLE_ADS", "META_ADS"] as PlatformFilter[]).map((p) => (
            <button
              key={p}
              onClick={() => setPlatformFilter(p)}
              style={{
                padding: "5px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: 500, cursor: "pointer", border: "1px solid",
                background: platformFilter === p ? "#f97316" : "transparent",
                borderColor: platformFilter === p ? "#f97316" : "#27272e",
                color: platformFilter === p ? "#fff" : "#71717a",
              }}
            >
              {p === "ALL" ? "All Platforms" : p === "GOOGLE_ADS" ? "Google Ads" : "Meta Ads"}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          {(["ALL", "ACTIVE", "PAUSED"] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                padding: "5px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: 500, cursor: "pointer", border: "1px solid",
                background: statusFilter === s ? "rgba(249,115,22,0.1)" : "transparent",
                borderColor: statusFilter === s ? "rgba(249,115,22,0.4)" : "#27272e",
                color: statusFilter === s ? "#fb923c" : "#71717a",
              }}
            >
              {s === "ALL" ? "All" : s}
            </button>
          ))}
        </div>
        <div style={{ flex: 1, minWidth: "180px", position: "relative" }}>
          <Search size={13} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#3f3f46" }} />
          <input
            placeholder="Search campaigns..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", height: "32px", paddingLeft: "30px", paddingRight: "10px", background: "#18181c", border: "1px solid #27272e", borderRadius: "7px", color: "#fafafa", fontSize: "12.5px", outline: "none", boxSizing: "border-box" }}
          />
        </div>
      </div>

      {/* Table */}
      <div style={{ ...S.card, overflow: "hidden" }}>
        <div style={{ padding: "16px 18px 14px", borderBottom: "1px solid #27272e" }}>
          <span style={{ fontFamily: '"Sora", sans-serif', fontSize: "14px", fontWeight: 700, color: "#fafafa" }}>All Campaigns</span>
          <span style={{ marginLeft: "8px", fontSize: "11px", color: "#3f3f46" }}>{filtered.length} found</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Campaign", "Platform", "Status", "Budget/Day", "Impressions", "Clicks", "Conversions", "Spend", "ROAS"].map((h, i) => (
                  <th key={h} style={{ ...S.th, textAlign: i > 2 ? "right" : "left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ ...S.td, textAlign: "center", padding: "40px" }}>Loading campaigns...</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ ...S.td, textAlign: "center", padding: "48px" }}>
                    <div style={{ fontSize: "14px", color: "#52525b" }}>No campaigns found</div>
                    <Link href="/campaigns/new" style={{ textDecoration: "none" }}>
                      <button style={{ marginTop: "12px", padding: "8px 16px", background: "#f97316", border: "none", borderRadius: "7px", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        <Plus size={13} /> Create Campaign
                      </button>
                    </Link>
                  </td>
                </tr>
              ) : filtered.map((c) => {
                const roas = getRoas(c);
                return (
                  <tr key={c.id} style={{ transition: "background 0.1s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#18181c")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ ...S.td, borderBottom: "1px solid #1a1a1f" }}>
                      <Link href={`/campaigns/${c.id}`} style={{ color: "#fafafa", fontWeight: 500, textDecoration: "none", fontSize: "13px" }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#fb923c")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "#fafafa")}
                      >{c.name}</Link>
                    </td>
                    <td style={{ ...S.td }}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", padding: "3px 8px", borderRadius: "5px", fontSize: "11px", fontWeight: 600,
                        background: c.platform === "GOOGLE_ADS" ? "rgba(66,133,244,0.1)" : "rgba(24,119,242,0.1)",
                        color: c.platform === "GOOGLE_ADS" ? "#4285F4" : "#1877F2",
                      }}>{c.platform === "GOOGLE_ADS" ? "Google" : "Meta"}</span>
                    </td>
                    <td style={{ ...S.td }}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", padding: "3px 8px", borderRadius: "5px", fontSize: "11px", fontWeight: 600,
                        background: c.status === "ACTIVE" ? "rgba(52,211,153,0.08)" : "rgba(113,113,122,0.1)",
                        color: c.status === "ACTIVE" ? "#34d399" : "#71717a",
                      }}>{c.status}</span>
                    </td>
                    <td style={{ ...S.td, textAlign: "right", ...S.mono }}>{formatCurrency(Number(c.dailyBudget))}</td>
                    <td style={{ ...S.td, textAlign: "right", ...S.mono }}>{formatNumber(Number(c.impressions))}</td>
                    <td style={{ ...S.td, textAlign: "right", ...S.mono }}>{formatNumber(Number(c.clicks))}</td>
                    <td style={{ ...S.td, textAlign: "right", ...S.mono }}>{c.conversions}</td>
                    <td style={{ ...S.td, textAlign: "right", ...S.mono }}>{formatCurrency(Number(c.spend))}</td>
                    <td style={{ ...S.td, textAlign: "right" }}>
                      <span style={{ ...S.mono, fontWeight: 700, color: roas >= 4 ? "#34d399" : roas >= 2 ? "#fbbf24" : "#f87171" }}>
                        {roas.toFixed(1)}x
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
