"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

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

interface SubEntry {
  id: string;
  userName: string | null;
  userEmail: string;
  plan: string;
  status: string;
  currentPeriodEnd: string | null;
  createdAt: string;
}

export default function AdminSubscriptionsPage() {
  const [subs, setSubs] = useState<SubEntry[]>([]);
  const [planBreakdown, setPlanBreakdown] = useState<{ name: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, usersRes] = await Promise.all([
          fetch("/api/admin/stats"),
          fetch("/api/admin/users"),
        ]);
        if (statsRes.ok) {
          const d = await statsRes.json();
          setPlanBreakdown(
            (d.planDistribution ?? []).map((x: { name: string; value: number }) => ({ name: x.name, count: x.value }))
          );
        }
        if (usersRes.ok) {
          const users = await usersRes.json();
          setSubs(
            users.map((u: { id: string; name: string | null; email: string; plan: string; createdAt: string }) => ({
              id: u.id,
              userName: u.name,
              userEmail: u.email,
              plan: u.plan,
              status: "ACTIVE",
              currentPeriodEnd: null,
              createdAt: u.createdAt,
            }))
          );
        }
      } catch { /* silently fail */ }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: '"Sora", sans-serif', fontSize: "22px", fontWeight: 800, color: "#fafafa", letterSpacing: "-0.5px", marginBottom: "3px" }}>Subscriptions</h1>
        <p style={{ fontSize: "13px", color: "#52525b" }}>Overview of all subscriptions and plan distribution.</p>
      </div>

      {/* Plan Breakdown Chart */}
      <div style={{ ...S.card, padding: "20px 24px" }}>
        <div style={{ fontFamily: '"Sora", sans-serif', fontSize: "14px", fontWeight: 700, color: "#fafafa", marginBottom: "4px" }}>Plan Breakdown</div>
        <div style={{ fontSize: "12px", color: "#52525b", marginBottom: "16px" }}>Number of users on each plan</div>
        {planBreakdown.length > 0 ? (
          <div style={{ height: "240px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={planBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f25" />
                <XAxis dataKey="name" fontSize={11} tick={{ fill: "#52525b" }} axisLine={false} tickLine={false} />
                <YAxis fontSize={11} tick={{ fill: "#52525b" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={S.tooltip} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}
                  label={false}
                  fill="#f97316"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ padding: "32px 0", textAlign: "center", color: "#3f3f46", fontSize: "13px" }}>No subscription data available</div>
        )}
      </div>

      {/* Table */}
      <div style={{ ...S.card, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #27272e" }}>
          <span style={{ fontFamily: '"Sora", sans-serif', fontSize: "14px", fontWeight: 700, color: "#fafafa" }}>All Subscriptions</span>
          <span style={{ fontSize: "11px", color: "#3f3f46", marginLeft: "8px" }}>{subs.length} total</span>
        </div>
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#3f3f46", fontSize: "13px" }}>Loading...</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #1a1a1f" }}>
                  {["User", "Email", "Plan", "Status", "Period End", "Created"].map(h => (
                    <th key={h} style={{ padding: "10px 20px", textAlign: "left", ...S.label }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {subs.map((sub) => (
                  <tr key={sub.id} style={{ borderBottom: "1px solid #1a1a1f" }}>
                    <td style={{ padding: "12px 20px", color: "#fafafa", fontWeight: 500 }}>{sub.userName ?? "Unnamed"}</td>
                    <td style={{ padding: "12px 20px", color: "#71717a" }}>{sub.userEmail}</td>
                    <td style={{ padding: "12px 20px" }}>
                      <span style={{ padding: "2px 8px", borderRadius: "5px", fontSize: "10.5px", fontWeight: 700, background: `${PLAN_COLORS[sub.plan] || "#3f3f46"}18`, color: PLAN_COLORS[sub.plan] || "#71717a" }}>
                        {sub.plan}
                      </span>
                    </td>
                    <td style={{ padding: "12px 20px" }}>
                      <span style={{ padding: "2px 8px", borderRadius: "5px", fontSize: "10.5px", fontWeight: 700, background: sub.status === "ACTIVE" ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)", color: sub.status === "ACTIVE" ? "#34d399" : "#f87171" }}>
                        {sub.status}
                      </span>
                    </td>
                    <td style={{ padding: "12px 20px", color: "#52525b" }}>
                      {sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString("en-IN") : "—"}
                    </td>
                    <td style={{ padding: "12px 20px", color: "#52525b" }}>{new Date(sub.createdAt).toLocaleDateString("en-IN")}</td>
                  </tr>
                ))}
                {subs.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: "32px", textAlign: "center", color: "#3f3f46", fontSize: "13px" }}>No subscriptions found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
