"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, RefreshCw } from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/utils";

const S = {
  card: { background: "#111114", border: "1px solid #27272e", borderRadius: "12px" },
  label: { fontSize: "10px", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1px", color: "#3f3f46" },
};

interface Campaign {
  id: string; name: string; status: string; objective: string | null;
  dailyBudget: number; impressions: number; clicks: number;
  conversions: number; spend: number; revenue: number;
  adGroups: { id: string }[]; _count: { ads: number };
}

export default function MetaCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  async function fetchCampaigns() {
    try {
      const res = await fetch("/api/meta-ads/campaigns");
      if (res.ok) setCampaigns(await res.json());
    } catch { /* empty */ }
    setLoading(false);
  }

  useEffect(() => { fetchCampaigns(); }, []);

  async function handleSync() {
    setSyncing(true);
    try { await fetch("/api/meta-ads/sync", { method: "POST" }); await fetchCampaigns(); } catch { /* ignore */ }
    setSyncing(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link href="/meta-ads" style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", background: "#111114", border: "1px solid #27272e", borderRadius: "8px", color: "#71717a", textDecoration: "none", flexShrink: 0 }}>
            <ArrowLeft size={14} />
          </Link>
          <div>
            <h1 style={{ fontFamily: '"Sora", sans-serif', fontSize: "22px", fontWeight: 800, color: "#fafafa", letterSpacing: "-0.5px", marginBottom: "2px" }}>Meta Campaigns</h1>
            <p style={{ fontSize: "13px", color: "#52525b" }}>View and manage all your Meta Ads campaigns.</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={handleSync} disabled={syncing} style={{ display: "flex", alignItems: "center", gap: "7px", padding: "8px 14px", background: "transparent", border: "1px solid #27272e", borderRadius: "8px", color: "#a1a1aa", fontSize: "13px", fontWeight: 500, cursor: syncing ? "not-allowed" : "pointer" }}>
            <RefreshCw size={13} style={{ animation: syncing ? "spin 1s linear infinite" : "none" }} />
            {syncing ? "Syncing..." : "Sync from Meta"}
          </button>
          <Link href="/campaigns/new?platform=META_ADS" style={{ display: "flex", alignItems: "center", gap: "7px", padding: "8px 14px", background: "#1877F2", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}>
            <Plus size={13} /> New Campaign
          </Link>
        </div>
      </div>

      {/* Table */}
      <div style={{ ...S.card, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #27272e" }}>
          <span style={{ fontFamily: '"Sora", sans-serif', fontSize: "14px", fontWeight: 700, color: "#fafafa" }}>All Campaigns</span>
          <span style={{ fontSize: "11px", color: "#3f3f46", marginLeft: "8px" }}>{campaigns.length} campaign{campaigns.length !== 1 ? "s" : ""}</span>
        </div>
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#3f3f46", fontSize: "13px" }}>Loading campaigns...</div>
        ) : campaigns.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center" }}>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#fafafa", marginBottom: "6px" }}>No campaigns found</div>
            <div style={{ fontSize: "12.5px", color: "#52525b" }}>Create a new campaign or sync your existing Meta Ads campaigns.</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #1a1a1f" }}>
                  {["Campaign", "Status", "Objective", "Budget/Day", "Impressions", "Clicks", "Conv.", "Spend", "ROAS", "Ad Sets", "Ads"].map((h, i) => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: i >= 3 ? "right" : "left", ...S.label }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {campaigns.map(c => {
                  const roas = c.spend > 0 ? c.revenue / c.spend : 0;
                  return (
                    <tr key={c.id} style={{ borderBottom: "1px solid #1a1a1f" }}>
                      <td style={{ padding: "12px 16px" }}>
                        <Link href={`/campaigns/${c.id}`} style={{ color: "#fafafa", fontWeight: 500, textDecoration: "none" }}>{c.name}</Link>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ padding: "2px 8px", borderRadius: "5px", fontSize: "10.5px", fontWeight: 700, background: c.status === "ACTIVE" ? "rgba(52,211,153,0.1)" : "rgba(113,113,122,0.1)", color: c.status === "ACTIVE" ? "#34d399" : "#71717a" }}>{c.status}</span>
                      </td>
                      <td style={{ padding: "12px 16px", color: "#71717a" }}>{c.objective?.replace("OUTCOME_", "").replace(/_/g, " ") || "—"}</td>
                      <td style={{ padding: "12px 16px", textAlign: "right", color: "#a1a1aa" }}>{formatCurrency(c.dailyBudget)}</td>
                      <td style={{ padding: "12px 16px", textAlign: "right", color: "#a1a1aa" }}>{formatNumber(c.impressions)}</td>
                      <td style={{ padding: "12px 16px", textAlign: "right", color: "#a1a1aa" }}>{formatNumber(c.clicks)}</td>
                      <td style={{ padding: "12px 16px", textAlign: "right", color: "#a1a1aa" }}>{c.conversions}</td>
                      <td style={{ padding: "12px 16px", textAlign: "right", color: "#fafafa", fontWeight: 500 }}>{formatCurrency(c.spend)}</td>
                      <td style={{ padding: "12px 16px", textAlign: "right", color: roas >= 2 ? "#34d399" : roas >= 1 ? "#fbbf24" : "#f87171", fontWeight: 600 }}>{roas.toFixed(2)}x</td>
                      <td style={{ padding: "12px 16px", textAlign: "right", color: "#71717a" }}>{c.adGroups.length}</td>
                      <td style={{ padding: "12px 16px", textAlign: "right", color: "#71717a" }}>{c._count.ads}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
