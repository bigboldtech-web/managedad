"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  DollarSign, Eye, MousePointerClick, Target, TrendingUp, TrendingDown,
  Users, BarChart3, RefreshCw, Link2, Unlink, Loader2, ArrowUpDown, ArrowUp, ArrowDown, Zap,
} from "lucide-react";
import { formatCurrency, formatNumber, formatPercent, formatCompactNumber } from "@/lib/utils";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const S = {
  card: { background: "#111114", border: "1px solid #27272e", borderRadius: "12px" },
  mono: { fontFamily: "var(--font-ibm-plex-mono), monospace" },
  th: { padding: "10px 14px", fontSize: "10px", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1px", color: "#3f3f46", borderBottom: "1px solid #27272e", whiteSpace: "nowrap" as const },
};

const META_BLUE = "#1877F2";

type DateRange = "7d" | "14d" | "30d" | "90d";

interface Connection {
  id: string; adAccountId: string; accountName: string | null; isActive: boolean; lastSyncAt: string | null;
}
interface Summary {
  totalSpend: number; totalImpressions: number; totalClicks: number; totalReach: number;
  totalConversions: number; totalRevenue: number; avgCtr: number; avgCpc: number;
  costPerResult: number; avgRoas: number;
}
interface DailyTrend {
  date: string; spend: number; impressions: number; clicks: number;
  conversions: number; reach: number; ctr: number; cpc: number;
}
interface CampaignData {
  id: string; name: string; status: string; objective: string; dailyBudget: number;
  impressions: number; clicks: number; reach: number; conversions: number; spend: number;
  revenue: number; ctr: number; cpc: number; cpa: number; roas: number; costPerResult: number;
}
interface OverviewData {
  currency: string; summary: Summary; previousPeriod: Summary;
  dailyTrend: DailyTrend[]; campaigns: CampaignData[];
}

const EMPTY_SUMMARY: Summary = {
  totalSpend: 0, totalImpressions: 0, totalClicks: 0, totalReach: 0,
  totalConversions: 0, totalRevenue: 0, avgCtr: 0, avgCpc: 0, costPerResult: 0, avgRoas: 0,
};

type SortField = keyof CampaignData;
type StatusFilter = "all" | "ACTIVE" | "PAUSED";

function calcChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return ((current - previous) / previous) * 100;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#18181c", border: "1px solid #27272e", borderRadius: "8px", padding: "10px 14px" }}>
      <div style={{ fontSize: "11px", color: "#71717a", marginBottom: "6px" }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ fontSize: "12px", color: p.color, marginBottom: "2px" }}>
          {p.name}: <span style={{ fontWeight: 600 }}>{p.name === "Spend" ? formatCurrency(p.value) : p.name === "CTR" ? `${Number(p.value).toFixed(2)}%` : p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function MetaAdsPage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [range, setRange] = useState<DateRange>("14d");
  const [sortField, setSortField] = useState<SortField>("spend");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  useEffect(() => { fetchConnections(); }, []);
  useEffect(() => { fetchOverview(); }, [range]); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchConnections() {
    try {
      const res = await fetch("/api/meta-ads/connections");
      if (res.ok) setConnections(await res.json());
    } catch {}
    setLoading(false);
  }

  async function fetchOverview() {
    setLoading(true);
    try {
      const res = await fetch(`/api/meta-ads/overview?range=${range}`);
      if (res.ok) setOverview(await res.json());
    } catch {}
    setLoading(false);
  }

  async function handleSync() {
    setSyncing(true);
    try {
      await fetch("/api/meta-ads/sync", { method: "POST" });
      await fetchOverview();
      await fetchConnections();
    } catch {}
    setSyncing(false);
  }

  async function handleDisconnect(connectionId: string) {
    setDisconnecting(connectionId);
    try {
      const res = await fetch(`/api/meta-ads/connections?id=${connectionId}`, { method: "DELETE" });
      if (res.ok) {
        setConnections((prev) => prev.filter((c) => c.id !== connectionId));
        await fetchOverview();
      }
    } catch {}
    setDisconnecting(null);
  }

  function handleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("desc"); }
  }

  const hasConnection = connections.some((c) => c.isActive);
  const activeConnection = connections.find((c) => c.isActive);

  const s = overview?.summary || (loading ? null : EMPTY_SUMMARY);
  const prev = overview?.previousPeriod || (loading ? null : EMPTY_SUMMARY);
  const trendData = overview?.dailyTrend || [];
  const campaignList = overview?.campaigns || [];
  const isDemo = !overview && !loading;

  const sortedCampaigns = campaignList
    .filter((c) => statusFilter === "all" || c.status === statusFilter)
    .sort((a, b) => {
      const aVal = a[sortField] ?? 0; const bVal = b[sortField] ?? 0;
      if (typeof aVal === "string" && typeof bVal === "string")
        return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      return sortDir === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });

  const kpiCards = s && prev ? [
    { label: "Total Spend", value: formatCurrency(s.totalSpend), change: calcChange(s.totalSpend, prev.totalSpend), icon: DollarSign, invert: true },
    { label: "Impressions", value: formatCompactNumber(s.totalImpressions), change: calcChange(s.totalImpressions, prev.totalImpressions), icon: Eye },
    { label: "Reach", value: formatCompactNumber(s.totalReach), change: calcChange(s.totalReach, prev.totalReach), icon: Users },
    { label: "Clicks", value: formatCompactNumber(s.totalClicks), change: calcChange(s.totalClicks, prev.totalClicks), icon: MousePointerClick },
    { label: "CTR", value: formatPercent(s.avgCtr), change: calcChange(s.avgCtr, prev.avgCtr), icon: BarChart3 },
    { label: "Conversions", value: formatNumber(s.totalConversions), change: calcChange(s.totalConversions, prev.totalConversions), icon: Target },
    { label: "Cost / Result", value: formatCurrency(s.costPerResult), change: calcChange(s.costPerResult, prev.costPerResult), icon: Zap, invert: true },
    { label: "ROAS", value: `${s.avgRoas.toFixed(2)}x`, change: calcChange(s.avgRoas, prev.avgRoas), icon: TrendingUp },
  ] : [];

  const SortBtn = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown size={10} style={{ opacity: 0.3 }} />;
    return sortDir === "asc" ? <ArrowUp size={10} /> : <ArrowDown size={10} />;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "3px" }}>
            <div style={{ width: "22px", height: "22px", borderRadius: "5px", background: META_BLUE, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "12px", fontWeight: 900, color: "#fff" }}>f</span>
            </div>
            <h1 style={{ fontFamily: '"Sora", sans-serif', fontSize: "22px", fontWeight: 800, color: "#fafafa", letterSpacing: "-0.5px" }}>Meta Ads</h1>
            {isDemo && <span style={{ padding: "2px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: 700, background: "rgba(251,191,36,0.1)", color: "#fbbf24" }}>DEMO</span>}
          </div>
          {activeConnection ? (
            <p style={{ fontSize: "12.5px", color: "#52525b" }}>
              {activeConnection.accountName || activeConnection.adAccountId}
              {activeConnection.lastSyncAt && <> · Last synced {new Date(activeConnection.lastSyncAt).toLocaleString()}</>}
            </p>
          ) : (
            <p style={{ fontSize: "12.5px", color: "#52525b" }}>Connect your Meta Ads account to see live data.</p>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          {/* Date range */}
          <div style={{ display: "flex", gap: "4px", background: "#18181c", border: "1px solid #27272e", borderRadius: "8px", padding: "3px" }}>
            {(["7d", "14d", "30d", "90d"] as DateRange[]).map((r) => (
              <button key={r} onClick={() => setRange(r)} style={{ padding: "4px 10px", borderRadius: "5px", fontSize: "11.5px", fontWeight: 500, cursor: "pointer", border: "none", background: range === r ? "#27272e" : "transparent", color: range === r ? "#fafafa" : "#52525b", transition: "all 0.15s" }}>
                {r}
              </button>
            ))}
          </div>
          {hasConnection && (
            <button onClick={handleSync} disabled={syncing} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 14px", background: "transparent", border: "1px solid #27272e", borderRadius: "8px", color: "#71717a", fontSize: "12.5px", cursor: syncing ? "not-allowed" : "pointer" }}>
              <RefreshCw size={13} style={{ animation: syncing ? "spin 1s linear infinite" : "none" }} />
              {syncing ? "Syncing..." : "Sync"}
            </button>
          )}
          <Link href="/api/meta-ads/connect" style={{ textDecoration: "none" }}>
            <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 14px", background: META_BLUE, border: "none", borderRadius: "8px", color: "#fff", fontSize: "12.5px", fontWeight: 600, cursor: "pointer" }}>
              <Link2 size={13} /> {hasConnection ? "Add Account" : "Connect Meta"}
            </button>
          </Link>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px" }}>
          <Loader2 size={24} style={{ color: "#3f3f46", animation: "spin 1s linear infinite" }} />
        </div>
      )}

      {!loading && (
        <>
          {/* KPI Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
            {kpiCards.map((kpi) => {
              const change = kpi.change;
              const isGood = kpi.invert ? (change !== null && change <= 0) : (change !== null && change >= 0);
              const changeColor = change === null ? "#52525b" : isGood ? "#34d399" : "#f87171";
              const ChangeIcon = change !== null ? (isGood ? TrendingUp : TrendingDown) : null;
              return (
                <div key={kpi.label} style={{ ...S.card, padding: "16px 18px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                    <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#3f3f46" }}>{kpi.label}</span>
                    <kpi.icon size={14} color="#3f3f46" />
                  </div>
                  <div style={{ ...S.mono, fontFamily: '"Sora", sans-serif', fontSize: "20px", fontWeight: 800, color: "#fafafa", letterSpacing: "-0.5px", marginBottom: "6px" }}>{kpi.value}</div>
                  {change !== null && ChangeIcon && (
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <ChangeIcon size={11} color={changeColor} />
                      <span style={{ fontSize: "11px", fontWeight: 600, color: changeColor }}>{Math.abs(change).toFixed(1)}%</span>
                      <span style={{ fontSize: "11px", color: "#3f3f46" }}>vs prev</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Charts */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div style={{ ...S.card, padding: "20px 22px" }}>
              <div style={{ fontFamily: '"Sora", sans-serif', fontSize: "13px", fontWeight: 700, color: "#fafafa", marginBottom: "16px" }}>Spend & Conversions</div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f1f25" />
                  <XAxis dataKey="date" tickFormatter={(v) => { const d = new Date(v); return `${d.getDate()}/${d.getMonth()+1}`; }} tick={{ fontSize: 10, fill: "#3f3f46" }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "#3f3f46" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: "#3f3f46" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: "11px", color: "#52525b" }} />
                  <Line yAxisId="left" type="monotone" dataKey="spend" name="Spend" stroke={META_BLUE} strokeWidth={2} dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="conversions" name="Conversions" stroke="#34d399" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ ...S.card, padding: "20px 22px" }}>
              <div style={{ fontFamily: '"Sora", sans-serif', fontSize: "13px", fontWeight: 700, color: "#fafafa", marginBottom: "16px" }}>CTR & CPC Trend</div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f1f25" />
                  <XAxis dataKey="date" tickFormatter={(v) => { const d = new Date(v); return `${d.getDate()}/${d.getMonth()+1}`; }} tick={{ fontSize: 10, fill: "#3f3f46" }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "#3f3f46" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v.toFixed(1)}%`} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: "#3f3f46" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v.toFixed(0)}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: "11px", color: "#52525b" }} />
                  <Line yAxisId="left" type="monotone" dataKey="ctr" name="CTR" stroke="#818cf8" strokeWidth={2} dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="cpc" name="CPC" stroke="#fbbf24" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Campaigns Table */}
          <div style={{ ...S.card, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #27272e", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <span style={{ fontFamily: '"Sora", sans-serif', fontSize: "14px", fontWeight: 700, color: "#fafafa" }}>Campaigns</span>
                <span style={{ fontSize: "12px", color: "#52525b", marginLeft: "8px" }}>{sortedCampaigns.length} campaigns</span>
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                {(["all", "ACTIVE", "PAUSED"] as StatusFilter[]).map((f) => (
                  <button key={f} onClick={() => setStatusFilter(f)} style={{ padding: "5px 12px", borderRadius: "6px", fontSize: "11.5px", fontWeight: 500, cursor: "pointer", border: "1px solid", background: statusFilter === f ? "rgba(24,119,242,0.1)" : "transparent", borderColor: statusFilter === f ? "rgba(24,119,242,0.4)" : "#27272e", color: statusFilter === f ? "#60a5fa" : "#52525b" }}>
                    {f === "all" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {[
                      { label: "Campaign", field: "name" as SortField, align: "left" },
                      { label: "Status", field: "status" as SortField, align: "left" },
                      { label: "Objective", field: "objective" as SortField, align: "left" },
                      { label: "Results", field: "conversions" as SortField, align: "right" },
                      { label: "Cost/Result", field: "costPerResult" as SortField, align: "right" },
                      { label: "Budget/day", field: "dailyBudget" as SortField, align: "right" },
                      { label: "Spend", field: "spend" as SortField, align: "right" },
                      { label: "Reach", field: "reach" as SortField, align: "right" },
                      { label: "Clicks", field: "clicks" as SortField, align: "right" },
                      { label: "CTR", field: "ctr" as SortField, align: "right" },
                      { label: "ROAS", field: "roas" as SortField, align: "right" },
                    ].map(({ label, field, align }) => (
                      <th key={field} onClick={() => handleSort(field)} style={{ ...S.th, textAlign: align as "left" | "right", cursor: "pointer", userSelect: "none" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          {label} <SortBtn field={field} />
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedCampaigns.map((c) => {
                    const roasColor = c.roas >= 4 ? "#34d399" : c.roas >= 2 ? "#fbbf24" : c.roas > 0 ? "#f87171" : "#52525b";
                    const obj = (c.objective || "—").replace("OUTCOME_", "").replace(/_/g, " ");
                    return (
                      <tr key={c.id}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#18181c")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        style={{ transition: "background 0.1s" }}>
                        <td style={{ padding: "12px 14px", fontSize: "12.5px", color: "#e4e4e7", fontWeight: 500, borderBottom: "1px solid #1a1a1f", maxWidth: "220px" }}>
                          <Link href={`/campaigns/${c.id}`} style={{ textDecoration: "none", color: "#e4e4e7" }}>{c.name}</Link>
                        </td>
                        <td style={{ padding: "12px 14px", borderBottom: "1px solid #1a1a1f" }}>
                          <span style={{ padding: "2px 7px", borderRadius: "4px", fontSize: "10px", fontWeight: 600, background: c.status === "ACTIVE" ? "rgba(52,211,153,0.08)" : "rgba(113,113,122,0.1)", color: c.status === "ACTIVE" ? "#34d399" : "#71717a" }}>{c.status}</span>
                        </td>
                        <td style={{ padding: "12px 14px", fontSize: "11px", color: "#52525b", borderBottom: "1px solid #1a1a1f", textTransform: "capitalize" }}>{obj.toLowerCase()}</td>
                        <td style={{ padding: "12px 14px", textAlign: "right", fontSize: "12.5px", color: "#a1a1aa", borderBottom: "1px solid #1a1a1f", ...S.mono }}>{c.conversions > 0 ? formatNumber(c.conversions) : "—"}</td>
                        <td style={{ padding: "12px 14px", textAlign: "right", fontSize: "12.5px", color: "#a1a1aa", borderBottom: "1px solid #1a1a1f", ...S.mono }}>{c.costPerResult > 0 ? formatCurrency(c.costPerResult) : "—"}</td>
                        <td style={{ padding: "12px 14px", textAlign: "right", fontSize: "12.5px", color: "#a1a1aa", borderBottom: "1px solid #1a1a1f", ...S.mono }}>{c.dailyBudget > 0 ? formatCurrency(c.dailyBudget) : "—"}</td>
                        <td style={{ padding: "12px 14px", textAlign: "right", fontSize: "12.5px", color: "#fafafa", fontWeight: 600, borderBottom: "1px solid #1a1a1f", ...S.mono }}>{formatCurrency(c.spend)}</td>
                        <td style={{ padding: "12px 14px", textAlign: "right", fontSize: "12.5px", color: "#a1a1aa", borderBottom: "1px solid #1a1a1f", ...S.mono }}>{formatCompactNumber(c.reach)}</td>
                        <td style={{ padding: "12px 14px", textAlign: "right", fontSize: "12.5px", color: "#a1a1aa", borderBottom: "1px solid #1a1a1f", ...S.mono }}>{formatCompactNumber(c.clicks)}</td>
                        <td style={{ padding: "12px 14px", textAlign: "right", fontSize: "12.5px", color: "#a1a1aa", borderBottom: "1px solid #1a1a1f", ...S.mono }}>{c.ctr > 0 ? formatPercent(c.ctr) : "—"}</td>
                        <td style={{ padding: "12px 14px", textAlign: "right", borderBottom: "1px solid #1a1a1f" }}>
                          {c.roas > 0 ? (
                            <span style={{ fontSize: "12.5px", fontWeight: 700, color: roasColor, ...S.mono }}>{c.roas.toFixed(2)}x</span>
                          ) : <span style={{ fontSize: "12.5px", color: "#52525b" }}>—</span>}
                        </td>
                      </tr>
                    );
                  })}
                  {sortedCampaigns.length === 0 && (
                    <tr><td colSpan={11} style={{ textAlign: "center", padding: "32px", fontSize: "13px", color: "#52525b" }}>No campaigns found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Connected Accounts */}
          {connections.filter((c) => c.isActive).length > 0 && (
            <div style={{ ...S.card, padding: "16px 20px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#3f3f46", marginBottom: "12px" }}>
                Connected Accounts ({connections.filter((c) => c.isActive).length})
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                {connections.filter((c) => c.isActive).map((c) => (
                  <div key={c.id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", background: "#18181c", border: "1px solid #27272e", borderRadius: "8px" }}>
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#34d399" }} />
                    <span style={{ fontSize: "12.5px", color: "#e4e4e7", fontWeight: 500 }}>{c.accountName || c.adAccountId}</span>
                    <button onClick={() => handleDisconnect(c.id)} disabled={disconnecting === c.id} style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", display: "flex", alignItems: "center", color: "#3f3f46" }}>
                      {disconnecting === c.id ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : <Unlink size={12} />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
