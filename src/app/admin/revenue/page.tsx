"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp,
  Users,
  UserMinus,
  IndianRupee,
  UserPlus,
  FlaskConical,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";

const S = {
  card: {
    background: "#111114",
    border: "1px solid #27272e",
    borderRadius: "12px",
  },
  label: {
    fontSize: "10px",
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: "1px",
    color: "#3f3f46",
  },
  tooltip: {
    background: "#18181c",
    border: "1px solid #27272e",
    borderRadius: "8px",
    color: "#fafafa",
    fontSize: "12px",
  },
};

const PLAN_COLORS: Record<string, string> = {
  STARTER: "#f97316",
  GROWTH: "#34d399",
  AGENCY: "#818cf8",
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "#34d399",
  CANCELLED: "#ef4444",
  PAST_DUE: "#f59e0b",
  TRIALING: "#818cf8",
};

interface RevenueData {
  mrr: number;
  mrrTrend: { month: string; mrr: number }[];
  activeSubscriptions: number;
  churnCount: number;
  churnRate: number;
  trialCount: number;
  revenueByPlan: { plan: string; count: number; revenue: number }[];
  signups7d: number;
  signups30d: number;
  arpu: number;
  ltv: number;
  avgDurationMonths: number;
  recentActivity: {
    id: string;
    name: string;
    email: string;
    plan: string;
    status: string;
    date: string;
    createdAt: string;
  }[];
}

export default function RevenueAnalyticsPage() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/revenue")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) setData(d);
      })
      .finally(() => setLoading(false));
  }, []);

  const d = data ?? {
    mrr: 0,
    mrrTrend: [],
    activeSubscriptions: 0,
    churnCount: 0,
    churnRate: 0,
    trialCount: 0,
    revenueByPlan: [],
    signups7d: 0,
    signups30d: 0,
    arpu: 0,
    ltv: 0,
    avgDurationMonths: 0,
    recentActivity: [],
  };

  const kpis = [
    {
      label: "MRR",
      value: loading ? "\u2014" : formatCurrency(d.mrr),
      icon: TrendingUp,
      color: "#f97316",
    },
    {
      label: "Active Subscribers",
      value: loading ? "\u2014" : d.activeSubscriptions.toLocaleString(),
      icon: Users,
      color: "#34d399",
    },
    {
      label: "Churn Rate (30d)",
      value: loading ? "\u2014" : `${d.churnRate}%`,
      icon: UserMinus,
      color: "#ef4444",
    },
    {
      label: "ARPU",
      value: loading ? "\u2014" : formatCurrency(d.arpu),
      icon: IndianRupee,
      color: "#818cf8",
    },
    {
      label: "Trial Users",
      value: loading ? "\u2014" : d.trialCount.toLocaleString(),
      icon: FlaskConical,
      color: "#f59e0b",
    },
    {
      label: "New Signups (30d)",
      value: loading ? "\u2014" : d.signups30d.toLocaleString(),
      icon: UserPlus,
      color: "#4285F4",
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: '"Sora", sans-serif',
              fontSize: "22px",
              fontWeight: 800,
              color: "#fafafa",
              letterSpacing: "-0.5px",
              marginBottom: "3px",
            }}
          >
            Revenue Analytics
          </h1>
          <p style={{ fontSize: "13px", color: "#52525b" }}>
            MRR, churn, ARPU, LTV, and subscription metrics.
          </p>
        </div>
        {data && (
          <div
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "center",
              fontSize: "12px",
              color: "#52525b",
            }}
          >
            <span>
              LTV estimate:{" "}
              <span style={{ color: "#f97316", fontWeight: 700 }}>
                {formatCurrency(d.ltv)}
              </span>
            </span>
            <span style={{ color: "#27272e" }}>|</span>
            <span>
              Avg duration:{" "}
              <span style={{ color: "#fafafa", fontWeight: 600 }}>
                {d.avgDurationMonths} mo
              </span>
            </span>
            <span style={{ color: "#27272e" }}>|</span>
            <span>
              7d signups:{" "}
              <span style={{ color: "#fafafa", fontWeight: 600 }}>
                {d.signups7d}
              </span>
            </span>
          </div>
        )}
      </div>

      {/* KPI cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, 1fr)",
          gap: "12px",
        }}
      >
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            style={{
              ...S.card,
              padding: "18px 16px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "9px",
                background: `${kpi.color}18`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <kpi.icon size={15} color={kpi.color} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ ...S.label, marginBottom: "4px" }}>{kpi.label}</div>
              <div
                style={{
                  fontFamily: '"Sora", sans-serif',
                  fontSize: "18px",
                  fontWeight: 800,
                  color: "#fafafa",
                  letterSpacing: "-0.5px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {kpi.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div
        style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: "16px" }}
      >
        {/* MRR Trend */}
        <div style={{ ...S.card, padding: "20px 24px" }}>
          <div
            style={{
              fontFamily: '"Sora", sans-serif',
              fontSize: "14px",
              fontWeight: 700,
              color: "#fafafa",
              marginBottom: "4px",
            }}
          >
            MRR Trend
          </div>
          <div
            style={{
              fontSize: "12px",
              color: "#52525b",
              marginBottom: "20px",
            }}
          >
            Monthly recurring revenue over the last 6 months
          </div>
          {d.mrrTrend.length > 0 ? (
            <div style={{ height: "260px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={d.mrrTrend}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#1f1f25"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "#3f3f46", fontSize: 11 }}
                    axisLine={{ stroke: "#27272e" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#3f3f46", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) =>
                      v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                    }
                  />
                  <Tooltip
                    contentStyle={S.tooltip}
                    formatter={(v: any) => [formatCurrency(Number(v)), "MRR"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="mrr"
                    stroke="#f97316"
                    strokeWidth={2.5}
                    dot={{ fill: "#f97316", r: 4, strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: "#f97316" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div
              style={{
                padding: "60px 0",
                textAlign: "center",
                color: "#3f3f46",
                fontSize: "13px",
              }}
            >
              No trend data available
            </div>
          )}
        </div>

        {/* Revenue by Plan */}
        <div style={{ ...S.card, padding: "20px 24px" }}>
          <div
            style={{
              fontFamily: '"Sora", sans-serif',
              fontSize: "14px",
              fontWeight: 700,
              color: "#fafafa",
              marginBottom: "4px",
            }}
          >
            Revenue by Plan
          </div>
          <div
            style={{
              fontSize: "12px",
              color: "#52525b",
              marginBottom: "20px",
            }}
          >
            MRR contribution by subscription tier
          </div>
          {d.revenueByPlan.some((p) => p.revenue > 0) ? (
            <>
              <div style={{ height: "200px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={d.revenueByPlan} barSize={40}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#1f1f25"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="plan"
                      tick={{ fill: "#3f3f46", fontSize: 11 }}
                      axisLine={{ stroke: "#27272e" }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "#3f3f46", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: number) =>
                        v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                      }
                    />
                    <Tooltip
                      contentStyle={S.tooltip}
                      formatter={(v: any) => [formatCurrency(Number(v)), "Revenue"]}
                    />
                    <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                      {d.revenueByPlan.map((entry) => (
                        <Cell
                          key={entry.plan}
                          fill={PLAN_COLORS[entry.plan] || "#3f3f46"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {/* Plan breakdown legend */}
              <div
                style={{
                  display: "flex",
                  gap: "16px",
                  marginTop: "16px",
                  justifyContent: "center",
                }}
              >
                {d.revenueByPlan.map((p) => (
                  <div
                    key={p.plan}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: PLAN_COLORS[p.plan] || "#3f3f46",
                      }}
                    />
                    <span style={{ fontSize: "11px", color: "#71717a" }}>
                      {p.plan} ({p.count} subs)
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div
              style={{
                padding: "60px 0",
                textAlign: "center",
                color: "#3f3f46",
                fontSize: "13px",
              }}
            >
              No revenue data
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity Table */}
      <div style={{ ...S.card, overflow: "hidden" }}>
        <div
          style={{ padding: "16px 20px", borderBottom: "1px solid #27272e" }}
        >
          <div
            style={{
              fontFamily: '"Sora", sans-serif',
              fontSize: "14px",
              fontWeight: 700,
              color: "#fafafa",
            }}
          >
            Recent Subscription Activity
          </div>
          <div
            style={{ fontSize: "12px", color: "#52525b", marginTop: "2px" }}
          >
            Latest subscription changes across all users
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "13px",
            }}
          >
            <thead>
              <tr style={{ borderBottom: "1px solid #1a1a1f" }}>
                {["Name", "Email", "Plan", "Status", "Last Updated", "Created"].map(
                  (h) => (
                    <th
                      key={h}
                      style={{
                        padding: "10px 20px",
                        textAlign: "left",
                        ...S.label,
                      }}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {d.recentActivity.map((row) => (
                <tr
                  key={row.id}
                  style={{ borderBottom: "1px solid #1a1a1f" }}
                >
                  <td
                    style={{
                      padding: "11px 20px",
                      color: "#fafafa",
                      fontWeight: 500,
                    }}
                  >
                    {row.name}
                  </td>
                  <td style={{ padding: "11px 20px", color: "#71717a" }}>
                    {row.email}
                  </td>
                  <td style={{ padding: "11px 20px" }}>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: "5px",
                        fontSize: "10.5px",
                        fontWeight: 700,
                        background: `${PLAN_COLORS[row.plan] || "#3f3f46"}18`,
                        color: PLAN_COLORS[row.plan] || "#71717a",
                      }}
                    >
                      {row.plan}
                    </span>
                  </td>
                  <td style={{ padding: "11px 20px" }}>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: "5px",
                        fontSize: "10.5px",
                        fontWeight: 700,
                        background: `${STATUS_COLORS[row.status] || "#3f3f46"}18`,
                        color: STATUS_COLORS[row.status] || "#71717a",
                      }}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td style={{ padding: "11px 20px", color: "#52525b" }}>
                    {new Date(row.date).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td style={{ padding: "11px 20px", color: "#52525b" }}>
                    {new Date(row.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
              {d.recentActivity.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: "32px",
                      textAlign: "center",
                      color: "#3f3f46",
                      fontSize: "13px",
                    }}
                  >
                    No subscription activity yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
