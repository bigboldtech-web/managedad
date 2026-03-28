"use client";

import { useEffect, useState, useCallback } from "react";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import { TrendingUp, TrendingDown, Download, RefreshCw } from "lucide-react";

type Range = "30d" | "90d" | "180d";

const S = {
  card: { background: "#111114", border: "1px solid #27272e", borderRadius: "12px" },
  label: { fontSize: "10px", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1px", color: "#3f3f46" },
  tooltip: { background: "#18181c", border: "1px solid #27272e", borderRadius: "8px", color: "#fafafa", fontSize: "12px" },
};

interface WeekData {
  weekStart: string; weekLabel: string;
  spend: number; revenue: number; clicks: number; conversions: number;
  impressions: number; roas: number; ctr: number; cpa: number;
  google: number; meta: number;
}

interface ReportData {
  weeks: WeekData[];
  totals: { spend: number; revenue: number; conversions: number; clicks: number; roas: number; cpa: number; weeksCount: number };
  audits: { id: string; score: number; summary: string | null; createdAt: string }[];
  optimizationRuns: { id: string; actionsCount: number; summary: Record<string, unknown> | null; createdAt: string }[];
  hasData: boolean;
}

function ChangeChip({ value, invert = false }: { value: number; invert?: boolean }) {
  const positive = invert ? value <= 0 : value >= 0;
  return (
    <span style={{ fontSize: "11px", fontWeight: 600, color: positive ? "#34d399" : "#f87171", display: "flex", alignItems: "center", gap: "3px" }}>
      {positive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
      {value >= 0 ? "+" : ""}{value}%
    </span>
  );
}

function scoreColor(score: number) {
  if (score >= 80) return "#34d399";
  if (score >= 60) return "#fbbf24";
  return "#f87171";
}

export default function ReportsPage() {
  const [range, setRange] = useState<Range>("90d");
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (r: Range, quiet = false) => {
    if (!quiet) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetch(`/api/reports?range=${r}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(range); }, [range, load]);

  const weeks = data?.weeks || [];
  const totals = data?.totals;

  // Compute week-over-week change for current vs previous week
  const currentWeek = weeks[0];
  const prevWeek = weeks[1];
  const roasChange = currentWeek && prevWeek && prevWeek.roas > 0
    ? parseFloat((((currentWeek.roas - prevWeek.roas) / prevWeek.roas) * 100).toFixed(1)) : 0;
  const spendChange = currentWeek && prevWeek && prevWeek.spend > 0
    ? parseFloat((((currentWeek.spend - prevWeek.spend) / prevWeek.spend) * 100).toFixed(1)) : 0;

  const kpis = [
    { label: "Total Spend", value: formatCurrency(totals?.spend || 0), sub: `${totals?.weeksCount || 0} weeks` },
    { label: "Total Revenue", value: formatCurrency(totals?.revenue || 0), sub: "Tracked revenue" },
    { label: "Overall ROAS", value: `${(totals?.roas || 0).toFixed(2)}x`, sub: roasChange !== 0 ? undefined : "vs prev period", chip: roasChange !== 0 ? <ChangeChip value={roasChange} /> : null },
    { label: "Conversions", value: formatNumber(totals?.conversions || 0), sub: `${formatCurrency(totals?.cpa || 0)} avg CPA` },
    { label: "Total Clicks", value: formatNumber(totals?.clicks || 0), sub: "All platforms" },
    { label: "Week Spend Δ", value: currentWeek ? formatCurrency(currentWeek.spend) : "—", sub: "Current week", chip: spendChange !== 0 ? <ChangeChip value={spendChange} invert /> : null },
  ];

  // Chart data — reversed for chronological order
  const chartData = [...weeks].reverse();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontFamily: '"Sora", sans-serif', fontSize: "22px", fontWeight: 800, color: "#fafafa", letterSpacing: "-0.5px", marginBottom: "3px" }}>Reports</h1>
          <p style={{ fontSize: "13px", color: "#52525b" }}>Weekly performance summaries and account health history.</p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <a
            href={`/api/reports/download?range=${range}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "7px 14px", borderRadius: "7px", fontSize: "12.5px", fontWeight: 500,
              background: "transparent", border: "1px solid #27272e", color: "#71717a",
              textDecoration: "none", cursor: "pointer",
            }}
          >
            <Download size={13} />
            Download Report
          </a>
          <button onClick={() => load(range, true)} disabled={refreshing} title="Refresh"
            style={{ width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "1px solid #27272e", borderRadius: "8px", color: "#71717a", cursor: "pointer" }}>
            <RefreshCw size={13} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
          </button>
          {(["30d", "90d", "180d"] as Range[]).map((r) => (
            <button key={r} onClick={() => setRange(r)} style={{
              padding: "7px 14px", borderRadius: "7px", fontSize: "12.5px", fontWeight: 500, cursor: "pointer", border: "1px solid",
              background: range === r ? "#f97316" : "transparent",
              borderColor: range === r ? "#f97316" : "#27272e",
              color: range === r ? "#fff" : "#71717a",
            }}>
              {r === "30d" ? "30 Days" : r === "90d" ? "90 Days" : "6 Months"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: "60px", textAlign: "center", color: "#3f3f46", fontSize: "13px" }}>Loading reports...</div>
      ) : !data?.hasData ? (
        <div style={{ ...S.card, padding: "60px", textAlign: "center" }}>
          <div style={{ fontSize: "15px", fontWeight: 600, color: "#fafafa", marginBottom: "8px" }}>No data yet</div>
          <div style={{ fontSize: "13px", color: "#52525b" }}>Connect your ad accounts and sync data to see performance reports.</div>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "12px" }}>
            {kpis.map((kpi) => (
              <div key={kpi.label} style={{ ...S.card, padding: "16px 18px" }}>
                <div style={{ ...S.label, marginBottom: "8px" }}>{kpi.label}</div>
                <div style={{ fontFamily: '"Sora", sans-serif', fontSize: "20px", fontWeight: 800, color: "#fafafa", letterSpacing: "-0.5px", marginBottom: "4px" }}>{kpi.value}</div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  {kpi.chip && kpi.chip}
                  {!kpi.chip && <span style={{ fontSize: "11px", color: "#52525b" }}>{kpi.sub}</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Weekly ROAS + Spend Charts */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div style={{ ...S.card, padding: "20px 24px" }}>
              <div style={{ fontFamily: '"Sora", sans-serif', fontSize: "14px", fontWeight: 700, color: "#fafafa", marginBottom: "4px" }}>Weekly ROAS</div>
              <div style={{ fontSize: "12px", color: "#52525b", marginBottom: "16px" }}>Return on ad spend per week</div>
              <div style={{ height: "220px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f1f25" />
                    <XAxis dataKey="weekLabel" fontSize={10} tick={{ fill: "#3f3f46" }} axisLine={false} tickLine={false} />
                    <YAxis fontSize={10} tick={{ fill: "#3f3f46" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}x`} />
                    <Tooltip contentStyle={S.tooltip} formatter={(v) => [`${Number(v).toFixed(2)}x`, "ROAS"]} />
                    <Line type="monotone" dataKey="roas" stroke="#f97316" strokeWidth={2.5} dot={{ r: 3, fill: "#f97316" }} name="ROAS" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ ...S.card, padding: "20px 24px" }}>
              <div style={{ fontFamily: '"Sora", sans-serif', fontSize: "14px", fontWeight: 700, color: "#fafafa", marginBottom: "4px" }}>Weekly Spend by Platform</div>
              <div style={{ fontSize: "12px", color: "#52525b", marginBottom: "16px" }}>Google Ads vs Meta Ads</div>
              <div style={{ height: "220px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f1f25" />
                    <XAxis dataKey="weekLabel" fontSize={10} tick={{ fill: "#3f3f46" }} axisLine={false} tickLine={false} />
                    <YAxis fontSize={10} tick={{ fill: "#3f3f46" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={S.tooltip} formatter={(v) => formatCurrency(Number(v))} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px", color: "#71717a" }} />
                    <Bar dataKey="google" stackId="a" fill="#f97316" name="Google Ads" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="meta" stackId="a" fill="#1877F2" name="Meta Ads" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Weekly table */}
          <div style={{ ...S.card, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #27272e", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <span style={{ fontFamily: '"Sora", sans-serif', fontSize: "14px", fontWeight: 700, color: "#fafafa" }}>Weekly Breakdown</span>
                <span style={{ fontSize: "11px", color: "#3f3f46", marginLeft: "8px" }}>{weeks.length} weeks</span>
              </div>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #1a1a1f" }}>
                    {["Week of", "Spend", "Revenue", "ROAS", "Clicks", "Conv.", "CPA", "CTR", "Google", "Meta"].map((h, i) => (
                      <th key={h} style={{ padding: "10px 16px", textAlign: i >= 1 ? "right" : "left", ...S.label }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {weeks.map((w, idx) => (
                    <tr key={w.weekStart} style={{ borderBottom: "1px solid #1a1a1f", background: idx === 0 ? "rgba(249,115,22,0.03)" : "transparent" }}>
                      <td style={{ padding: "11px 16px", color: idx === 0 ? "#fb923c" : "#a1a1aa", fontWeight: idx === 0 ? 600 : 400 }}>
                        {idx === 0 && <span style={{ marginRight: "6px", fontSize: "9px", padding: "1px 5px", background: "rgba(249,115,22,0.1)", color: "#f97316", borderRadius: "4px", fontWeight: 700 }}>THIS WEEK</span>}
                        {w.weekLabel}
                      </td>
                      <td style={{ padding: "11px 16px", textAlign: "right", color: "#fafafa", fontWeight: 500 }}>{formatCurrency(w.spend)}</td>
                      <td style={{ padding: "11px 16px", textAlign: "right", color: "#a1a1aa" }}>{formatCurrency(w.revenue)}</td>
                      <td style={{ padding: "11px 16px", textAlign: "right", color: w.roas >= 2 ? "#34d399" : w.roas >= 1 ? "#fbbf24" : "#f87171", fontWeight: 600 }}>{w.roas.toFixed(2)}x</td>
                      <td style={{ padding: "11px 16px", textAlign: "right", color: "#71717a" }}>{formatNumber(w.clicks)}</td>
                      <td style={{ padding: "11px 16px", textAlign: "right", color: "#a1a1aa" }}>{w.conversions}</td>
                      <td style={{ padding: "11px 16px", textAlign: "right", color: "#71717a" }}>{w.cpa > 0 ? formatCurrency(w.cpa) : "—"}</td>
                      <td style={{ padding: "11px 16px", textAlign: "right", color: "#71717a" }}>{w.ctr.toFixed(2)}%</td>
                      <td style={{ padding: "11px 16px", textAlign: "right", color: "#71717a" }}>{formatCurrency(w.google)}</td>
                      <td style={{ padding: "11px 16px", textAlign: "right", color: "#71717a" }}>{formatCurrency(w.meta)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom: Audit history + Optimization runs */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            {/* Audit History */}
            <div style={{ ...S.card, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #27272e" }}>
                <span style={{ fontFamily: '"Sora", sans-serif', fontSize: "14px", fontWeight: 700, color: "#fafafa" }}>Account Audit History</span>
                <span style={{ fontSize: "11px", color: "#3f3f46", marginLeft: "8px" }}>{data?.audits.length || 0} audits</span>
              </div>
              {!data?.audits.length ? (
                <div style={{ padding: "32px", textAlign: "center", color: "#3f3f46", fontSize: "13px" }}>No audits run yet. Visit the Audit page to run your first account audit.</div>
              ) : (
                <div>
                  {data.audits.map((audit) => (
                    <div key={audit.id} style={{ padding: "14px 20px", borderBottom: "1px solid #1a1a1f", display: "flex", alignItems: "flex-start", gap: "14px" }}>
                      <div style={{
                        width: "44px", height: "44px", borderRadius: "10px", flexShrink: 0,
                        background: `rgba(${audit.score >= 80 ? "52,211,153" : audit.score >= 60 ? "251,191,36" : "248,113,113"},0.1)`,
                        border: `1px solid ${scoreColor(audit.score)}30`,
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                      }}>
                        <span style={{ fontSize: "16px", fontWeight: 800, color: scoreColor(audit.score), lineHeight: 1 }}>{audit.score}</span>
                        <span style={{ fontSize: "9px", color: scoreColor(audit.score), marginTop: "2px" }}>/100</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: "#fafafa", marginBottom: "3px" }}>
                          Health Score: {audit.score}/100
                        </div>
                        {audit.summary && (
                          <div style={{ fontSize: "12px", color: "#71717a", lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>
                            {audit.summary}
                          </div>
                        )}
                        <div style={{ fontSize: "11px", color: "#3f3f46", marginTop: "4px" }}>
                          {new Date(audit.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Optimization Run History */}
            <div style={{ ...S.card, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #27272e" }}>
                <span style={{ fontFamily: '"Sora", sans-serif', fontSize: "14px", fontWeight: 700, color: "#fafafa" }}>Optimization Runs</span>
                <span style={{ fontSize: "11px", color: "#3f3f46", marginLeft: "8px" }}>{data?.optimizationRuns.length || 0} runs</span>
              </div>
              {!data?.optimizationRuns.length ? (
                <div style={{ padding: "32px", textAlign: "center", color: "#3f3f46", fontSize: "13px" }}>No completed runs yet. Run the optimization engine from Automations.</div>
              ) : (
                <div>
                  {data.optimizationRuns.map((run) => {
                    const summary = run.summary as { actionsByType?: Record<string, number>; campaignsAnalyzed?: number } | null;
                    const topAction = summary?.actionsByType
                      ? Object.entries(summary.actionsByType).sort(([, a], [, b]) => b - a)[0]
                      : null;
                    return (
                      <div key={run.id} style={{ padding: "12px 20px", borderBottom: "1px solid #1a1a1f", display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{
                          width: "38px", height: "38px", borderRadius: "8px", flexShrink: 0,
                          background: "rgba(249,115,22,0.1)", display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <span style={{ fontSize: "13px", fontWeight: 800, color: "#f97316" }}>{run.actionsCount}</span>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "13px", fontWeight: 500, color: "#fafafa" }}>
                            {run.actionsCount} action{run.actionsCount !== 1 ? "s" : ""}
                            {summary?.campaignsAnalyzed ? ` across ${summary.campaignsAnalyzed} campaigns` : ""}
                          </div>
                          {topAction && (
                            <div style={{ fontSize: "11.5px", color: "#52525b", marginTop: "2px" }}>
                              Top: {topAction[1]}× {topAction[0].replace(/_/g, " ").toLowerCase()}
                            </div>
                          )}
                          <div style={{ fontSize: "11px", color: "#3f3f46", marginTop: "2px" }}>
                            {new Date(run.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}{" "}
                            {new Date(run.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
