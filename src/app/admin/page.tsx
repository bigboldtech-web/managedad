"use client";

import { useEffect, useState } from "react";
import { Users, CreditCard, TrendingUp, BarChart3 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const S = {
  card: { background: "#111114", border: "1px solid #27272e", borderRadius: "12px" },
  label: { fontSize: "10px", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1px", color: "#3f3f46" },
  tooltip: { background: "#18181c", border: "1px solid #27272e", borderRadius: "8px", color: "#fafafa", fontSize: "12px" },
};

const PLAN_COLORS: Record<string, string> = {
  FREE: "#3f3f46",
  STARTER: "#f97316",
  GROWTH: "#34d399",
  AGENCY: "#818cf8",
};

interface AdminStats {
  totalUsers: number;
  activeSubscriptions: number;
  mrr: number;
  totalCampaigns: number;
  recentSignups: { id: string; name: string | null; email: string; createdAt: string; plan: string }[];
  planDistribution: { name: string; value: number }[];
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setStats(d); })
      .finally(() => setLoading(false));
  }, []);

  const data = stats ?? { totalUsers: 0, activeSubscriptions: 0, mrr: 0, totalCampaigns: 0, recentSignups: [], planDistribution: [] };

  const kpis = [
    { label: "Total Users", value: loading ? "—" : data.totalUsers.toLocaleString(), icon: Users, color: "#4285F4" },
    { label: "Active Subscriptions", value: loading ? "—" : data.activeSubscriptions.toLocaleString(), icon: CreditCard, color: "#34d399" },
    { label: "MRR", value: loading ? "—" : formatCurrency(data.mrr), icon: TrendingUp, color: "#f97316" },
    { label: "Total Campaigns", value: loading ? "—" : data.totalCampaigns.toLocaleString(), icon: BarChart3, color: "#818cf8" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: '"Sora", sans-serif', fontSize: "22px", fontWeight: 800, color: "#fafafa", letterSpacing: "-0.5px", marginBottom: "3px" }}>Admin Dashboard</h1>
        <p style={{ fontSize: "13px", color: "#52525b" }}>Platform-wide metrics and user activity.</p>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
        {kpis.map((kpi) => (
          <div key={kpi.label} style={{ ...S.card, padding: "18px 20px", display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: "38px", height: "38px", borderRadius: "9px", background: `${kpi.color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <kpi.icon size={16} color={kpi.color} />
            </div>
            <div>
              <div style={{ ...S.label, marginBottom: "4px" }}>{kpi.label}</div>
              <div style={{ fontFamily: '"Sora", sans-serif', fontSize: "22px", fontWeight: 800, color: "#fafafa", letterSpacing: "-0.5px" }}>{kpi.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom row */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px" }}>
        {/* Recent Signups */}
        <div style={{ ...S.card, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #27272e" }}>
            <div style={{ fontFamily: '"Sora", sans-serif', fontSize: "14px", fontWeight: 700, color: "#fafafa" }}>Recent Signups</div>
            <div style={{ fontSize: "12px", color: "#52525b", marginTop: "2px" }}>Latest users who joined the platform</div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #1a1a1f" }}>
                  {["Name", "Email", "Plan", "Joined"].map(h => (
                    <th key={h} style={{ padding: "10px 20px", textAlign: "left", ...S.label }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.recentSignups.map((user) => (
                  <tr key={user.id} style={{ borderBottom: "1px solid #1a1a1f" }}>
                    <td style={{ padding: "11px 20px", color: "#fafafa", fontWeight: 500 }}>{user.name ?? "Unnamed"}</td>
                    <td style={{ padding: "11px 20px", color: "#71717a" }}>{user.email}</td>
                    <td style={{ padding: "11px 20px" }}>
                      <span style={{ padding: "2px 8px", borderRadius: "5px", fontSize: "10.5px", fontWeight: 700, background: `${PLAN_COLORS[user.plan] || "#3f3f46"}18`, color: PLAN_COLORS[user.plan] || "#71717a" }}>
                        {user.plan}
                      </span>
                    </td>
                    <td style={{ padding: "11px 20px", color: "#52525b" }}>{new Date(user.createdAt).toLocaleDateString("en-IN")}</td>
                  </tr>
                ))}
                {data.recentSignups.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: "32px", textAlign: "center", color: "#3f3f46", fontSize: "13px" }}>No recent signups</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Plan Distribution */}
        <div style={{ ...S.card, padding: "20px 24px" }}>
          <div style={{ fontFamily: '"Sora", sans-serif', fontSize: "14px", fontWeight: 700, color: "#fafafa", marginBottom: "4px" }}>Plan Distribution</div>
          <div style={{ fontSize: "12px", color: "#52525b", marginBottom: "16px" }}>Subscription breakdown by plan</div>
          {data.planDistribution.length > 0 ? (
            <>
              <div style={{ height: "200px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.planDistribution} cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={4} dataKey="value">
                      {data.planDistribution.map((item) => (
                        <Cell key={item.name} fill={PLAN_COLORS[item.name] || "#3f3f46"} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={S.tooltip} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "12px", justifyContent: "center" }}>
                {data.planDistribution.map((item) => (
                  <div key={item.name} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: PLAN_COLORS[item.name] || "#3f3f46" }} />
                    <span style={{ fontSize: "11px", color: "#71717a" }}>{item.name} ({item.value})</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ padding: "32px 0", textAlign: "center", color: "#3f3f46", fontSize: "13px" }}>No subscription data</div>
          )}
        </div>
      </div>
    </div>
  );
}
