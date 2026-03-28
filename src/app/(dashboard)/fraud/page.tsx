"use client";

import { useState, useEffect, useCallback } from "react";
import { Shield, AlertTriangle, Ban, Activity } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const S = {
  card: { background: "#111114", border: "1px solid #27272e", borderRadius: "12px" },
  mono: { fontFamily: "var(--font-ibm-plex-mono), monospace" },
  tooltip: { background: "#18181c", border: "1px solid #27272e", borderRadius: "8px", color: "#fafafa", fontSize: "12px" },
};

interface FraudData {
  kpis: { blockedThisMonth: number; savingsThisMonth: number; fraudRate: string; ipsBlocked: number };
  blockedIPs: { ip: string; fraudScore: number; reason: string; clickCount: number; savings: number; blockedAt: string }[];
  alerts: { ip: string; fraudScore: number; reasons: string[]; country: string; clickedAt: string }[];
  trend: { date: string; clicks: number; blocked: number }[];
  signalBreakdown: Record<string, number>;
}

export default function FraudPage() {
  const [tab, setTab] = useState<"overview" | "ips" | "alerts">("overview");
  const [data, setData] = useState<FraudData | null>(null);
  const [loading, setLoading] = useState(true);
  const [blocking, setBlocking] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/fraud/events");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function blockIP(ip: string, reason: string) {
    setBlocking(ip);
    try {
      await fetch("/api/fraud/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip, reason }),
      });
      await load();
    } finally {
      setBlocking(null);
    }
  }

  const kpis = data?.kpis;
  const blockedIPs = data?.blockedIPs || [];
  const alerts = data?.alerts || [];
  const trend = data?.trend || [];
  const signals = data?.signalBreakdown || {};

  // Build signal bars from signal breakdown
  const totalSignals = Object.values(signals).reduce((s, v) => s + v, 0) || 1;
  const signalBars = Object.entries(signals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([label, count], i) => ({
      signal: label,
      pct: Math.round((count / totalSignals) * 100),
      color: ["#f87171", "#fbbf24", "#fb923c", "#818cf8", "#38bdf8"][i],
    }));

  // Fallback signal bars if no real data yet
  const displaySignals = signalBars.length > 0 ? signalBars : [
    { signal: "Click Velocity", pct: 38, color: "#f87171" },
    { signal: "Bot User Agents", pct: 27, color: "#fbbf24" },
    { signal: "Geographic Mismatch", pct: 19, color: "#fb923c" },
    { signal: "VPN/Proxy IPs", pct: 11, color: "#818cf8" },
    { signal: "Headless Browsers", pct: 5, color: "#38bdf8" },
  ];

  // Build alerts from real data + fallback
  const displayAlerts = alerts.length > 0
    ? alerts.map((a) => ({
        severity: a.fraudScore > 0.9 ? "CRITICAL" : "WARNING" as "CRITICAL" | "WARNING",
        title: `Fraud detected from ${a.ip}`,
        message: (a.reasons || []).join(" · ") || "High fraud score",
        time: new Date(a.clickedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      }))
    : [
        { severity: "INFO" as "CRITICAL" | "WARNING" | "INFO", title: "Protection active", message: "No fraud events recorded yet. Add the tracking snippet to your landing pages.", time: "Now" },
      ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontFamily: '"Sora", sans-serif', fontSize: "22px", fontWeight: 800, color: "#fafafa", letterSpacing: "-0.5px", marginBottom: "3px" }}>Fraud Detection</h1>
          <p style={{ fontSize: "13px", color: "#52525b" }}>Real-time click fraud detection and IP blocking across all campaigns.</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 14px", background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)", borderRadius: "8px" }}>
          <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#34d399" }} />
          <span style={{ fontSize: "12px", fontWeight: 600, color: "#34d399" }}>Protection Active</span>
        </div>
      </div>

      {/* Snippet info card */}
      <div style={{ ...S.card, padding: "14px 18px", display: "flex", alignItems: "center", gap: "14px", borderColor: "rgba(249,115,22,0.2)" }}>
        <div style={{ flexShrink: 0, width: "8px", height: "8px", borderRadius: "50%", background: "#f97316" }} />
        <div style={{ flex: 1, fontSize: "12.5px", color: "#71717a" }}>
          Add tracking to your landing pages: <code style={{ ...S.mono, fontSize: "11px", background: "#1a1a1f", padding: "2px 7px", borderRadius: "4px", color: "#fb923c" }}>{`<script src="${typeof window !== "undefined" ? window.location.origin : ""}/api/fraud/report?uid=YOUR_USER_ID"></script>`}</code>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
        {[
          { label: "Blocked This Month", value: loading ? "—" : String(kpis?.blockedThisMonth ?? 0), sub: "fraudulent clicks", icon: Ban, color: "#f87171" },
          { label: "Savings This Month", value: loading ? "—" : `₹${((kpis?.savingsThisMonth ?? 0) / 100).toLocaleString("en-IN")}`, sub: "invalid clicks stopped", icon: Shield, color: "#34d399" },
          { label: "Fraud Rate", value: loading ? "—" : `${kpis?.fraudRate ?? "0.0"}%`, sub: "of total clicks", icon: AlertTriangle, color: "#fbbf24" },
          { label: "IPs Blocked", value: loading ? "—" : String(kpis?.ipsBlocked ?? 0), sub: "across all campaigns", icon: Activity, color: "#fb923c" },
        ].map(stat => (
          <div key={stat.label} style={{ ...S.card, padding: "16px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#3f3f46" }}>{stat.label}</div>
              <stat.icon size={14} color={stat.color} />
            </div>
            <div style={{ fontFamily: '"Sora", sans-serif', fontSize: "22px", fontWeight: 800, color: stat.color, letterSpacing: "-0.5px", marginBottom: "2px" }}>{stat.value}</div>
            <div style={{ fontSize: "11px", color: "#52525b" }}>{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "6px" }}>
        {[
          { id: "overview", label: "Overview" },
          { id: "ips", label: `Blocked IPs (${blockedIPs.length})` },
          { id: "alerts", label: `Alerts (${alerts.length})` },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as "overview" | "ips" | "alerts")} style={{
            padding: "7px 14px", borderRadius: "7px", fontSize: "12.5px", fontWeight: 500, cursor: "pointer", border: "1px solid",
            background: tab === t.id ? "rgba(249,115,22,0.1)" : "transparent",
            borderColor: tab === t.id ? "rgba(249,115,22,0.4)" : "#27272e",
            color: tab === t.id ? "#fb923c" : "#71717a",
          }}>{t.label}</button>
        ))}
      </div>

      {tab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px" }}>
          <div style={{ ...S.card, padding: "20px 24px" }}>
            <div style={{ fontFamily: '"Sora", sans-serif', fontSize: "15px", fontWeight: 700, color: "#fafafa", marginBottom: "4px" }}>Fraud Clicks Detected & Blocked</div>
            <div style={{ fontSize: "12px", color: "#52525b", marginBottom: "20px" }}>Last 14 days</div>
            <div style={{ height: "220px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend.length > 0 ? trend : Array.from({ length: 14 }, (_, i) => ({ date: `Day ${i + 1}`, clicks: 0, blocked: 0 }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f1f25" />
                  <XAxis dataKey="date" fontSize={10} tick={{ fill: "#3f3f46" }} axisLine={false} tickLine={false} />
                  <YAxis fontSize={10} tick={{ fill: "#3f3f46" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={S.tooltip} />
                  <Line type="monotone" dataKey="clicks" stroke="#f87171" strokeWidth={2} dot={false} name="Detected" />
                  <Line type="monotone" dataKey="blocked" stroke="#34d399" strokeWidth={2} dot={false} name="Blocked" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ ...S.card, padding: "20px" }}>
            <div style={{ fontFamily: '"Sora", sans-serif', fontSize: "15px", fontWeight: 700, color: "#fafafa", marginBottom: "16px" }}>Top Fraud Signals</div>
            {displaySignals.map(s => (
              <div key={s.signal} style={{ marginBottom: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ fontSize: "12px", color: "#a1a1aa" }}>{s.signal}</span>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: s.color, ...S.mono }}>{s.pct}%</span>
                </div>
                <div style={{ height: "4px", background: "#1f1f25", borderRadius: "2px" }}>
                  <div style={{ height: "100%", width: `${s.pct}%`, background: s.color, borderRadius: "2px" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "ips" && (
        <div style={{ ...S.card, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #27272e" }}>
            <span style={{ fontFamily: '"Sora", sans-serif', fontSize: "14px", fontWeight: 700, color: "#fafafa" }}>Blocked IPs</span>
            <span style={{ marginLeft: "8px", fontSize: "11px", color: "#3f3f46" }}>{blockedIPs.length} IPs blocked</span>
          </div>
          {blockedIPs.length === 0 ? (
            <div style={{ padding: "48px", textAlign: "center", color: "#3f3f46", fontSize: "13px" }}>No blocked IPs yet — fraud events will appear here once tracking is active</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["IP Address", "Clicks", "Fraud Score", "Reason", "Est. Savings", "Blocked", ""].map((h, i) => (
                      <th key={h} style={{ padding: "10px 16px", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#3f3f46", borderBottom: "1px solid #27272e", textAlign: i > 0 ? "right" : "left" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {blockedIPs.map(ip => (
                    <tr key={ip.ip}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#18181c")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      style={{ transition: "background 0.1s" }}>
                      <td style={{ padding: "12px 16px", fontSize: "12.5px", color: "#f87171", borderBottom: "1px solid #1a1a1f", ...S.mono }}>{ip.ip}</td>
                      <td style={{ padding: "12px 16px", fontSize: "12.5px", color: "#a1a1aa", borderBottom: "1px solid #1a1a1f", textAlign: "right", ...S.mono }}>{ip.clickCount}</td>
                      <td style={{ padding: "12px 16px", textAlign: "right", borderBottom: "1px solid #1a1a1f" }}>
                        <span style={{ fontSize: "12px", fontWeight: 700, color: ip.fraudScore > 0.9 ? "#f87171" : "#fbbf24", ...S.mono }}>{(ip.fraudScore * 100).toFixed(0)}%</span>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: "11.5px", color: "#52525b", borderBottom: "1px solid #1a1a1f" }}>{ip.reason}</td>
                      <td style={{ padding: "12px 16px", fontSize: "12.5px", color: "#34d399", borderBottom: "1px solid #1a1a1f", textAlign: "right", ...S.mono, fontWeight: 600 }}>₹{ip.savings}</td>
                      <td style={{ padding: "12px 16px", fontSize: "11.5px", color: "#3f3f46", borderBottom: "1px solid #1a1a1f", textAlign: "right" }}>
                        {new Date(ip.blockedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </td>
                      <td style={{ padding: "12px 16px", borderBottom: "1px solid #1a1a1f", textAlign: "right" }}>
                        <button
                          onClick={() => blockIP(ip.ip, ip.reason)}
                          disabled={blocking === ip.ip}
                          style={{ padding: "4px 10px", borderRadius: "5px", fontSize: "10.5px", fontWeight: 600, cursor: "pointer", border: "1px solid rgba(249,115,22,0.3)", background: "rgba(249,115,22,0.08)", color: "#fb923c" }}>
                          {blocking === ip.ip ? "…" : "Push to Ads"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "alerts" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {displayAlerts.map((alert, i) => (
            <div key={i} style={{ ...S.card, padding: "16px 20px", display: "flex", gap: "14px", alignItems: "flex-start" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", marginTop: "5px", flexShrink: 0, background: alert.severity === "CRITICAL" ? "#f87171" : alert.severity === "WARNING" ? "#fbbf24" : "#52525b" }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#fafafa" }}>{alert.title}</span>
                  <span style={{ padding: "1px 7px", borderRadius: "4px", fontSize: "9.5px", fontWeight: 700, background: alert.severity === "CRITICAL" ? "rgba(248,113,113,0.1)" : alert.severity === "WARNING" ? "rgba(251,191,36,0.1)" : "rgba(82,82,91,0.2)", color: alert.severity === "CRITICAL" ? "#f87171" : alert.severity === "WARNING" ? "#fbbf24" : "#71717a" }}>{alert.severity}</span>
                </div>
                <div style={{ fontSize: "12.5px", color: "#71717a" }}>{alert.message}</div>
              </div>
              <div style={{ fontSize: "11px", color: "#3f3f46", whiteSpace: "nowrap" }}>{alert.time}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
