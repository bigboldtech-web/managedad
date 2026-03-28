"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/utils";

const S = {
  card: { background: "#111114", border: "1px solid #27272e", borderRadius: "12px" },
  label: { fontSize: "10px", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1px", color: "#3f3f46" },
};

interface AdSet {
  id: string; name: string; status: string; bidAmount: number | null;
  bidStrategy: string | null;
  targeting: { age_min?: number; age_max?: number; geo_locations?: { countries?: string[] } } | null;
  impressions: number; clicks: number; conversions: number; spend: number;
  campaign: { id: string; name: string };
}

function formatTargeting(t: AdSet["targeting"]): string {
  if (!t) return "—";
  const parts: string[] = [];
  if (t.age_min || t.age_max) parts.push(`Ages ${t.age_min || 18}–${t.age_max || 65}`);
  if (t.geo_locations?.countries?.length) parts.push(t.geo_locations.countries.join(", "));
  return parts.length > 0 ? parts.join(" · ") : "—";
}

export default function MetaAdSetsPage() {
  const [adSets, setAdSets] = useState<AdSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  async function fetchAdSets() {
    try {
      const res = await fetch("/api/meta-ads/ad-sets");
      if (res.ok) setAdSets(await res.json());
    } catch { /* empty */ }
    setLoading(false);
  }

  useEffect(() => { fetchAdSets(); }, []);

  async function handleSync() {
    setSyncing(true);
    try { await fetch("/api/meta-ads/sync", { method: "POST" }); await fetchAdSets(); } catch { /* ignore */ }
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
            <h1 style={{ fontFamily: '"Sora", sans-serif', fontSize: "22px", fontWeight: 800, color: "#fafafa", letterSpacing: "-0.5px", marginBottom: "2px" }}>Ad Sets</h1>
            <p style={{ fontSize: "13px", color: "#52525b" }}>Targeting, budgets, and schedules for your Meta ad sets.</p>
          </div>
        </div>
        <button onClick={handleSync} disabled={syncing} style={{ display: "flex", alignItems: "center", gap: "7px", padding: "8px 16px", background: "transparent", border: "1px solid #27272e", borderRadius: "8px", color: "#a1a1aa", fontSize: "13px", fontWeight: 500, cursor: syncing ? "not-allowed" : "pointer" }}>
          <RefreshCw size={13} style={{ animation: syncing ? "spin 1s linear infinite" : "none" }} />
          {syncing ? "Syncing..." : "Sync from Meta"}
        </button>
      </div>

      {/* Table */}
      <div style={{ ...S.card, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #27272e" }}>
          <span style={{ fontFamily: '"Sora", sans-serif', fontSize: "14px", fontWeight: 700, color: "#fafafa" }}>All Ad Sets</span>
          <span style={{ fontSize: "11px", color: "#3f3f46", marginLeft: "8px" }}>{adSets.length} ad set{adSets.length !== 1 ? "s" : ""}</span>
        </div>
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#3f3f46", fontSize: "13px" }}>Loading ad sets...</div>
        ) : adSets.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center" }}>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#fafafa", marginBottom: "6px" }}>No ad sets found</div>
            <div style={{ fontSize: "12.5px", color: "#52525b" }}>Ad sets appear after syncing your Meta Ads account.</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #1a1a1f" }}>
                  {["Ad Set", "Campaign", "Status", "Targeting", "Bid", "Impressions", "Clicks", "Conv.", "Spend"].map((h, i) => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: i >= 4 ? "right" : "left", ...S.label }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {adSets.map(a => (
                  <tr key={a.id} style={{ borderBottom: "1px solid #1a1a1f" }}>
                    <td style={{ padding: "12px 16px", color: "#fafafa", fontWeight: 500 }}>{a.name}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <Link href={`/campaigns/${a.campaign.id}`} style={{ color: "#71717a", textDecoration: "none", fontSize: "12.5px" }}>{a.campaign.name}</Link>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ padding: "2px 8px", borderRadius: "5px", fontSize: "10.5px", fontWeight: 700, background: a.status === "ACTIVE" ? "rgba(52,211,153,0.1)" : "rgba(113,113,122,0.1)", color: a.status === "ACTIVE" ? "#34d399" : "#71717a" }}>{a.status}</span>
                    </td>
                    <td style={{ padding: "12px 16px", color: "#71717a", maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "12px" }}>{formatTargeting(a.targeting)}</td>
                    <td style={{ padding: "12px 16px", textAlign: "right", color: "#a1a1aa" }}>{a.bidAmount ? formatCurrency(a.bidAmount) : a.bidStrategy || "—"}</td>
                    <td style={{ padding: "12px 16px", textAlign: "right", color: "#a1a1aa" }}>{formatNumber(a.impressions)}</td>
                    <td style={{ padding: "12px 16px", textAlign: "right", color: "#a1a1aa" }}>{formatNumber(a.clicks)}</td>
                    <td style={{ padding: "12px 16px", textAlign: "right", color: "#a1a1aa" }}>{a.conversions}</td>
                    <td style={{ padding: "12px 16px", textAlign: "right", color: "#fafafa", fontWeight: 500 }}>{formatCurrency(a.spend)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
