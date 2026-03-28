"use client";

import { useEffect, useState, useCallback } from "react";
import { formatCurrency, formatNumber, formatPercent, formatCompactNumber } from "@/lib/utils";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";

type DateRange = "7d" | "30d" | "90d";

const S = {
  card: { background: "#111114", border: "1px solid #27272e", borderRadius: "12px" },
  label: { fontSize: "10px", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1px", color: "#3f3f46" },
  mono: { fontFamily: "var(--font-ibm-plex-mono), monospace" },
  tooltip: { background: "#18181c", border: "1px solid #27272e", borderRadius: "8px", color: "#fafafa", fontSize: "12px" },
};

interface AnalyticsData {
  trend: { date: string; google: number; meta: number; conversions: number; clicks: number; ctr: number }[];
  totals: { spend: number; conversions: number; clicks: number; avgCtr: number; avgCpa: number; roas: number; revenue: number };
  changes: { spend: number; conversions: number; clicks: number; revenue: number };
  hasData: boolean;
}

export default function AnalyticsPage() {
  const [range, setRange] = useState<DateRange>("30d");
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (r: DateRange) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?range=${r}`);
      if (res.ok) setAnalytics(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(range); }, [range, load]);

  const data = analytics?.trend || [];
  const totals = analytics?.totals;
  const changes = analytics?.changes;

  const kpis = [
    { label: "Total Spend", value: loading ? "—" : formatCurrency(totals?.spend || 0), change: changes ? `${changes.spend >= 0 ? "+" : ""}${changes.spend}%` : "—", up: (changes?.spend || 0) <= 10 },
    { label: "Conversions", value: loading ? "—" : formatNumber(totals?.conversions || 0), change: changes ? `${changes.conversions >= 0 ? "+" : ""}${changes.conversions}%` : "—", up: (changes?.conversions || 0) >= 0 },
    { label: "Clicks", value: loading ? "—" : formatCompactNumber(totals?.clicks || 0), change: changes ? `${changes.clicks >= 0 ? "+" : ""}${changes.clicks}%` : "—", up: (changes?.clicks || 0) >= 0 },
    { label: "Avg. CTR", value: loading ? "—" : `${(totals?.avgCtr || 0).toFixed(2)}%`, change: "—", up: true },
    { label: "Avg. CPA", value: loading ? "—" : formatCurrency(totals?.avgCpa || 0), change: "—", up: false },
    { label: "ROAS", value: loading ? "—" : `${(totals?.roas || 0).toFixed(2)}x`, change: changes ? `${changes.revenue >= 0 ? "+" : ""}${changes.revenue}%` : "—", up: (changes?.revenue || 0) >= 0 },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontFamily: '"Sora", sans-serif', fontSize: "22px", fontWeight: 800, color: "#fafafa", letterSpacing: "-0.5px", marginBottom: "3px" }}>Analytics</h1>
          <p style={{ fontSize: "13px", color: "#52525b" }}>Performance breakdown across all platforms and campaigns.</p>
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          {(["7d", "30d", "90d"] as DateRange[]).map((r) => (
            <button key={r} onClick={() => setRange(r)} style={{
              padding: "7px 14px", borderRadius: "7px", fontSize: "12.5px", fontWeight: 500, cursor: "pointer", border: "1px solid",
              background: range === r ? "#f97316" : "transparent",
              borderColor: range === r ? "#f97316" : "#27272e",
              color: range === r ? "#fff" : "#71717a",
            }}>
              {r === "7d" ? "7 Days" : r === "30d" ? "30 Days" : "90 Days"}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "12px" }}>
        {kpis.map((kpi) => (
          <div key={kpi.label} style={{ ...S.card, padding: "16px 18px" }}>
            <div style={{ ...S.label, marginBottom: "8px" }}>{kpi.label}</div>
            <div style={{ ...S.mono, fontFamily: '"Sora", sans-serif', fontSize: "20px", fontWeight: 800, color: "#fafafa", letterSpacing: "-0.5px", marginBottom: "4px" }}>{kpi.value}</div>
            <div style={{ fontSize: "11px", color: kpi.up ? "#34d399" : "#f87171" }}>
              {kpi.up ? "↑" : "↓"} {kpi.change}
            </div>
          </div>
        ))}
      </div>

      {/* Spend Over Time */}
      <div style={{ ...S.card, padding: "20px 24px" }}>
        <div style={{ marginBottom: "20px" }}>
          <div style={{ fontFamily: '"Sora", sans-serif', fontSize: "15px", fontWeight: 700, color: "#fafafa", marginBottom: "3px" }}>Spend Over Time</div>
          <div style={{ fontSize: "12px", color: "#52525b" }}>Daily ad spend by platform</div>
        </div>
        <div style={{ height: "260px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f25" />
              <XAxis dataKey="date" fontSize={10} tick={{ fill: "#3f3f46" }} axisLine={false} tickLine={false} interval={Math.floor(data.length / 6)} />
              <YAxis fontSize={10} tick={{ fill: "#3f3f46" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={S.tooltip} formatter={(v: any) => formatCurrency(Number(v))} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px", color: "#71717a" }} />
              <Line type="monotone" dataKey="google" stroke="#f97316" strokeWidth={2} dot={false} name="Google Ads" />
              <Line type="monotone" dataKey="meta" stroke="#34d399" strokeWidth={2} dot={false} name="Meta Ads" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        {/* Conversions */}
        <div style={{ ...S.card, padding: "20px 24px" }}>
          <div style={{ marginBottom: "16px" }}>
            <div style={{ fontFamily: '"Sora", sans-serif', fontSize: "15px", fontWeight: 700, color: "#fafafa", marginBottom: "3px" }}>Daily Conversions</div>
            <div style={{ fontSize: "12px", color: "#52525b" }}>All platforms combined</div>
          </div>
          <div style={{ height: "200px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f25" />
                <XAxis dataKey="date" fontSize={10} tick={{ fill: "#3f3f46" }} axisLine={false} tickLine={false} interval={Math.floor(data.length / 5)} />
                <YAxis fontSize={10} tick={{ fill: "#3f3f46" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={S.tooltip} />
                <Bar dataKey="conversions" fill="#f97316" radius={[3, 3, 0, 0]} name="Conversions" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CTR */}
        <div style={{ ...S.card, padding: "20px 24px" }}>
          <div style={{ marginBottom: "16px" }}>
            <div style={{ fontFamily: '"Sora", sans-serif', fontSize: "15px", fontWeight: 700, color: "#fafafa", marginBottom: "3px" }}>CTR Trend</div>
            <div style={{ fontSize: "12px", color: "#52525b" }}>Click-through rate over time</div>
          </div>
          <div style={{ height: "200px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f25" />
                <XAxis dataKey="date" fontSize={10} tick={{ fill: "#3f3f46" }} axisLine={false} tickLine={false} interval={Math.floor(data.length / 5)} />
                <YAxis fontSize={10} tick={{ fill: "#3f3f46" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                <Tooltip contentStyle={S.tooltip} formatter={(v: any) => `${Number(v).toFixed(2)}%`} />
                <Line type="monotone" dataKey="ctr" stroke="#fbbf24" strokeWidth={2} dot={false} name="CTR %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
