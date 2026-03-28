"use client";

import { useEffect, useState } from "react";
import { DollarSign, Eye, MousePointerClick, Target, TrendingUp, BarChart3, Zap, ArrowRight } from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatNumber, formatPercent, formatCompactNumber } from "@/lib/utils";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import OnboardingWizard from "@/components/onboarding/onboarding-wizard";

const S = {
  card: { background: "#111114", border: "1px solid #27272e", borderRadius: "12px" },
  mono: { fontFamily: "var(--font-ibm-plex-mono), monospace" },
};

const PLATFORM_COLORS = ["#f97316", "#34d399"];

interface DashboardMetrics {
  totalSpend: number; totalImpressions: number; totalClicks: number;
  totalConversions: number; avgCtr: number; avgRoas: number;
  spendTrend: { date: string; google: number; meta: number; total: number }[];
  platformBreakdown: { name: string; value: number }[];
  topCampaigns: { id: string; name: string; platform: string; spend: number; conversions: number; roas: number; status: string }[];
}

function getDemoMetrics(): DashboardMetrics {
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (29 - i));
    return `${d.getDate()}/${d.getMonth() + 1}`;
  });
  return {
    totalSpend: 248500, totalImpressions: 1245000, totalClicks: 38400,
    totalConversions: 1280, avgCtr: 3.08, avgRoas: 4.2,
    spendTrend: days.map((date) => ({
      date,
      google: Math.round(8000 + Math.random() * 4000),
      meta: Math.round(6000 + Math.random() * 3000),
      total: 0,
    })).map(d => ({ ...d, total: d.google + d.meta })),
    platformBreakdown: [{ name: "Google Ads", value: 145000 }, { name: "Meta Ads", value: 103500 }],
    topCampaigns: [
      { id: "1", name: "Brand Awareness — India", platform: "GOOGLE_ADS", spend: 68000, conversions: 284, roas: 6.0, status: "ACTIVE" },
      { id: "2", name: "Retargeting — Website Visitors", platform: "META_ADS", spend: 31000, conversions: 198, roas: 9.2, status: "ACTIVE" },
      { id: "3", name: "Product Launch Q2", platform: "GOOGLE_ADS", spend: 54000, conversions: 156, roas: 4.4, status: "ACTIVE" },
      { id: "4", name: "Lead Gen — Tier 1 Cities", platform: "META_ADS", spend: 42000, conversions: 124, roas: 0, status: "ACTIVE" },
      { id: "5", name: "Search — Competitors", platform: "GOOGLE_ADS", spend: 28000, conversions: 45, roas: 2.8, status: "PAUSED" },
    ],
  };
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#18181c", border: "1px solid #27272e", borderRadius: "8px", padding: "10px 14px" }}>
      <div style={{ fontSize: "11px", color: "#71717a", marginBottom: "6px" }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ fontSize: "12px", color: p.color, marginBottom: "2px" }}>
          {p.name}: <span style={{ fontWeight: 600 }}>{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [showOnboarding, setShowOnboarding] = useState<null | {
    userName: string;
    hasGoogle: boolean;
    hasMeta: boolean;
    hasCampaigns: boolean;
  }>(null);
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const res = await fetch("/api/dashboard/overview");
        if (res.ok) {
          const data = await res.json();
          setMetrics(data);

          // Check if user is brand new: no spend AND no campaigns
          const isEmpty =
            data.totalSpend === 0 &&
            (!data.topCampaigns || data.topCampaigns.length === 0) &&
            (!data.platformBreakdown || data.platformBreakdown.every((p: { value: number }) => p.value === 0));

          if (isEmpty) {
            // Check connections
            let hasGoogle = false;
            let hasMeta = false;
            let userName = "";
            try {
              const [gRes, mRes, sessionRes] = await Promise.all([
                fetch("/api/google-ads/connections"),
                fetch("/api/meta-ads/connections"),
                fetch("/api/auth/session"),
              ]);
              if (gRes.ok) {
                const gData = await gRes.json();
                hasGoogle = Array.isArray(gData) ? gData.length > 0 : !!gData?.connected;
              }
              if (mRes.ok) {
                const mData = await mRes.json();
                hasMeta = Array.isArray(mData) ? mData.length > 0 : !!mData?.connected;
              }
              if (sessionRes.ok) {
                const session = await sessionRes.json();
                userName = session?.user?.name || "";
              }
            } catch {}

            // Only show onboarding if no connections AND no campaigns
            if (!hasGoogle && !hasMeta) {
              setShowOnboarding({
                userName,
                hasGoogle,
                hasMeta,
                hasCampaigns: false,
              });
            }
          }
          setOnboardingChecked(true);
          return;
        }
      } catch {}
      setMetrics(getDemoMetrics());
      setOnboardingChecked(true);
    }
    fetchMetrics();
    const t = setTimeout(() => {
      setMetrics(m => m ?? getDemoMetrics());
      setOnboardingChecked(c => c || true);
    }, 1200);
    return () => clearTimeout(t);
  }, []);

  // Show nothing while checking onboarding status
  if (!onboardingChecked) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "calc(100vh - 120px)" }}>
        <div style={{ width: "24px", height: "24px", border: "2px solid #27272e", borderTopColor: "#f97316", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Show onboarding wizard for new users
  if (showOnboarding) {
    return (
      <OnboardingWizard
        userName={showOnboarding.userName}
        hasGoogleConnection={showOnboarding.hasGoogle}
        hasMetaConnection={showOnboarding.hasMeta}
        hasCampaigns={showOnboarding.hasCampaigns}
      />
    );
  }

  const data = metrics ?? getDemoMetrics();

  const kpis = [
    { label: "Total Spend", value: formatCurrency(data.totalSpend), icon: DollarSign, change: "+12.5%", up: false },
    { label: "Impressions", value: formatCompactNumber(data.totalImpressions), icon: Eye, change: "+8.2%", up: true },
    { label: "Clicks", value: formatCompactNumber(data.totalClicks), icon: MousePointerClick, change: "+15.3%", up: true },
    { label: "Conversions", value: formatNumber(data.totalConversions), icon: Target, change: "+22.1%", up: true },
    { label: "Avg. CTR", value: formatPercent(data.avgCtr), icon: TrendingUp, change: "+0.3%", up: true },
    { label: "Avg. ROAS", value: `${data.avgRoas.toFixed(1)}x`, icon: BarChart3, change: "+0.4x", up: true },
  ];

  const totalPlatformSpend = data.platformBreakdown.reduce((s, p) => s + p.value, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontFamily: '"Sora", sans-serif', fontSize: "22px", fontWeight: 800, color: "#fafafa", letterSpacing: "-0.5px", marginBottom: "3px" }}>Dashboard</h1>
          <p style={{ fontSize: "13px", color: "#52525b" }}>Overview of your advertising performance across all platforms.</p>
        </div>
        <Link href="/campaigns/new" style={{ textDecoration: "none" }}>
          <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 16px", background: "#f97316", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
            <Zap size={13} /> New Campaign
          </button>
        </Link>
      </div>

      {/* KPI Strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "12px" }}>
        {kpis.map((kpi) => (
          <div key={kpi.label} style={{ ...S.card, padding: "16px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
              <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#3f3f46" }}>{kpi.label}</span>
              <div style={{ width: "26px", height: "26px", borderRadius: "6px", background: "rgba(249,115,22,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <kpi.icon size={13} color="#f97316" />
              </div>
            </div>
            <div style={{ fontFamily: '"Sora", sans-serif', fontSize: "20px", fontWeight: 800, color: "#fafafa", letterSpacing: "-0.5px", marginBottom: "5px" }}>{kpi.value}</div>
            <div style={{ fontSize: "11px", color: kpi.up ? "#34d399" : "#f87171" }}>
              {kpi.up ? "↑" : "↑"} {kpi.change} vs last period
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px" }}>
        {/* Spend over time */}
        <div style={{ ...S.card, padding: "20px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <div>
              <div style={{ fontFamily: '"Sora", sans-serif', fontSize: "14px", fontWeight: 700, color: "#fafafa", marginBottom: "2px" }}>Spend Over Time</div>
              <div style={{ fontSize: "12px", color: "#52525b" }}>Daily ad spend by platform (last 30 days)</div>
            </div>
            <div style={{ display: "flex", gap: "14px" }}>
              {[{ label: "Google", color: "#f97316" }, { label: "Meta", color: "#34d399" }].map(p => (
                <div key={p.label} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: p.color }} />
                  <span style={{ fontSize: "11px", color: "#52525b" }}>{p.label}</span>
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.spendTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f25" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#3f3f46" }} axisLine={false} tickLine={false} interval={Math.floor(data.spendTrend.length / 6)} />
              <YAxis tick={{ fontSize: 10, fill: "#3f3f46" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="google" stroke="#f97316" strokeWidth={2} dot={false} name="Google" />
              <Line type="monotone" dataKey="meta" stroke="#34d399" strokeWidth={2} dot={false} name="Meta" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Platform breakdown */}
        <div style={{ ...S.card, padding: "20px 24px", display: "flex", flexDirection: "column" }}>
          <div style={{ fontFamily: '"Sora", sans-serif', fontSize: "14px", fontWeight: 700, color: "#fafafa", marginBottom: "4px" }}>Platform Breakdown</div>
          <div style={{ fontSize: "12px", color: "#52525b", marginBottom: "8px" }}>Spend distribution</div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={data.platformBreakdown} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                {data.platformBreakdown.map((_, i) => (
                  <Cell key={i} fill={PLATFORM_COLORS[i % PLATFORM_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "#18181c", border: "1px solid #27272e", borderRadius: "8px", fontSize: "12px" }} formatter={(v: any) => formatCurrency(Number(v))} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px" }}>
            {data.platformBreakdown.map((item, i) => {
              const pct = totalPlatformSpend > 0 ? (item.value / totalPlatformSpend) * 100 : 0;
              return (
                <div key={item.name}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: PLATFORM_COLORS[i] }} />
                      <span style={{ fontSize: "12px", color: "#a1a1aa" }}>{item.name}</span>
                    </div>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "#fafafa", ...S.mono }}>{formatCurrency(item.value)}</span>
                  </div>
                  <div style={{ height: "3px", background: "#1f1f25", borderRadius: "2px" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: PLATFORM_COLORS[i], borderRadius: "2px" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Campaigns */}
      <div style={{ ...S.card, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #27272e", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <span style={{ fontFamily: '"Sora", sans-serif', fontSize: "14px", fontWeight: 700, color: "#fafafa" }}>Top Campaigns</span>
            <span style={{ fontSize: "12px", color: "#52525b", marginLeft: "8px" }}>Best performing across all platforms</span>
          </div>
          <Link href="/campaigns" style={{ textDecoration: "none" }}>
            <button style={{ display: "flex", alignItems: "center", gap: "4px", padding: "5px 12px", background: "transparent", border: "1px solid #27272e", borderRadius: "6px", color: "#71717a", fontSize: "12px", cursor: "pointer" }}>
              View all <ArrowRight size={11} />
            </button>
          </Link>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Campaign", "Platform", "Status", "Spend", "Conv.", "ROAS"].map((h, i) => (
                  <th key={h} style={{ padding: "10px 14px", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#3f3f46", borderBottom: "1px solid #27272e", textAlign: i > 2 ? "right" : "left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.topCampaigns.map((campaign) => {
                const roasColor = campaign.roas >= 4 ? "#34d399" : campaign.roas >= 2 ? "#fbbf24" : campaign.roas > 0 ? "#f87171" : "#52525b";
                const isGoogle = campaign.platform === "GOOGLE_ADS";
                return (
                  <tr key={campaign.id}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#18181c")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    style={{ transition: "background 0.1s" }}>
                    <td style={{ padding: "12px 14px", fontSize: "13px", fontWeight: 500, color: "#e4e4e7", borderBottom: "1px solid #1a1a1f" }}>
                      <Link href={`/campaigns/${campaign.id}`} style={{ textDecoration: "none", color: "inherit" }}>{campaign.name}</Link>
                    </td>
                    <td style={{ padding: "12px 14px", borderBottom: "1px solid #1a1a1f" }}>
                      <span style={{ padding: "2px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: 700, background: isGoogle ? "rgba(66,133,244,0.1)" : "rgba(24,119,242,0.1)", color: isGoogle ? "#4285F4" : "#1877F2" }}>
                        {isGoogle ? "Google" : "Meta"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px", borderBottom: "1px solid #1a1a1f" }}>
                      <span style={{ padding: "2px 7px", borderRadius: "4px", fontSize: "10px", fontWeight: 600, background: campaign.status === "ACTIVE" ? "rgba(52,211,153,0.08)" : "rgba(113,113,122,0.1)", color: campaign.status === "ACTIVE" ? "#34d399" : "#71717a" }}>
                        {campaign.status}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px", textAlign: "right", fontSize: "13px", color: "#a1a1aa", borderBottom: "1px solid #1a1a1f", ...S.mono }}>{formatCurrency(campaign.spend)}</td>
                    <td style={{ padding: "12px 14px", textAlign: "right", fontSize: "13px", color: "#a1a1aa", borderBottom: "1px solid #1a1a1f", ...S.mono }}>{campaign.conversions}</td>
                    <td style={{ padding: "12px 14px", textAlign: "right", borderBottom: "1px solid #1a1a1f" }}>
                      {campaign.roas > 0 ? (
                        <span style={{ fontSize: "13px", fontWeight: 700, color: roasColor, ...S.mono }}>{campaign.roas.toFixed(1)}x</span>
                      ) : <span style={{ fontSize: "13px", color: "#52525b" }}>—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick links */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
        {[
          { label: "AI Automations", sub: "8 actions today", color: "#f97316", href: "/automations" },
          { label: "Fraud Blocked", sub: "183 clicks this month", color: "#f87171", href: "/fraud" },
          { label: "Creatives", sub: "1 ad needs refresh", color: "#fbbf24", href: "/creatives" },
          { label: "AI Chat", sub: "Ask your data anything", color: "#818cf8", href: "/chat" },
        ].map(item => (
          <Link key={item.label} href={item.href} style={{ textDecoration: "none" }}>
            <div style={{ ...S.card, padding: "16px 18px", cursor: "pointer", transition: "border-color 0.15s" }}
              onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.borderColor = item.color}
              onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.borderColor = "#27272e"}>
              <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: item.color, marginBottom: "6px" }}>{item.label}</div>
              <div style={{ fontSize: "13px", color: "#71717a" }}>{item.sub}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
