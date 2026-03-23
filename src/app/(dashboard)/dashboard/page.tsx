"use client";

import { useEffect, useState } from "react";
import {
  DollarSign,
  Eye,
  MousePointerClick,
  Target,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber, formatPercent, formatCompactNumber } from "@/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

interface DashboardMetrics {
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  avgCtr: number;
  avgRoas: number;
  spendTrend: { date: string; google: number; meta: number; total: number }[];
  platformBreakdown: { name: string; value: number }[];
  topCampaigns: {
    id: string;
    name: string;
    platform: string;
    spend: number;
    conversions: number;
    roas: number;
    status: string;
  }[];
}

const COLORS = ["#6366f1", "#3b82f6", "#10b981", "#f59e0b"];

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const res = await fetch("/api/dashboard/overview");
        if (res.ok) {
          const data = await res.json();
          setMetrics(data);
        }
      } catch {
        // Use demo data on error
      }
      setLoading(false);
    }

    fetchMetrics();

    // Fallback to demo data if API isn't ready
    const timer = setTimeout(() => {
      if (loading) {
        setMetrics(getDemoMetrics());
        setLoading(false);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const data = metrics ?? getDemoMetrics();

  const kpis = [
    {
      title: "Total Spend",
      value: formatCurrency(data.totalSpend),
      icon: DollarSign,
      change: "+12.5%",
      trend: "up" as const,
    },
    {
      title: "Impressions",
      value: formatCompactNumber(data.totalImpressions),
      icon: Eye,
      change: "+8.2%",
      trend: "up" as const,
    },
    {
      title: "Clicks",
      value: formatCompactNumber(data.totalClicks),
      icon: MousePointerClick,
      change: "+15.3%",
      trend: "up" as const,
    },
    {
      title: "Conversions",
      value: formatNumber(data.totalConversions),
      icon: Target,
      change: "+22.1%",
      trend: "up" as const,
    },
    {
      title: "Avg. CTR",
      value: formatPercent(data.avgCtr),
      icon: TrendingUp,
      change: "+0.3%",
      trend: "up" as const,
    },
    {
      title: "Avg. ROAS",
      value: `${data.avgRoas.toFixed(1)}x`,
      icon: BarChart3,
      change: "+0.4x",
      trend: "up" as const,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your advertising performance across all platforms.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.title}
              </CardTitle>
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className="text-xs text-green-600">
                {kpi.change} from last period
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Spend Over Time */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Spend Over Time</CardTitle>
            <CardDescription>Daily ad spend by platform (last 30 days)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.spendTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="google"
                    stroke="#4285F4"
                    strokeWidth={2}
                    dot={false}
                    name="Google Ads"
                  />
                  <Line
                    type="monotone"
                    dataKey="meta"
                    stroke="#1877F2"
                    strokeWidth={2}
                    dot={false}
                    name="Meta Ads"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Platform Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Breakdown</CardTitle>
            <CardDescription>Spend distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.platformBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.platformBreakdown.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex justify-center gap-4">
              {data.platformBreakdown.map((item, i) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: COLORS[i] }}
                  />
                  <span className="text-sm">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle>Top Campaigns</CardTitle>
          <CardDescription>Best performing campaigns across all platforms</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 font-medium text-muted-foreground">Campaign</th>
                  <th className="pb-3 font-medium text-muted-foreground">Platform</th>
                  <th className="pb-3 font-medium text-muted-foreground">Status</th>
                  <th className="pb-3 text-right font-medium text-muted-foreground">Spend</th>
                  <th className="pb-3 text-right font-medium text-muted-foreground">Conversions</th>
                  <th className="pb-3 text-right font-medium text-muted-foreground">ROAS</th>
                </tr>
              </thead>
              <tbody>
                {data.topCampaigns.map((campaign) => (
                  <tr key={campaign.id} className="border-b last:border-0">
                    <td className="py-3 font-medium">{campaign.name}</td>
                    <td className="py-3">
                      <Badge
                        variant={
                          campaign.platform === "GOOGLE_ADS"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {campaign.platform === "GOOGLE_ADS"
                          ? "Google"
                          : "Meta"}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <Badge
                        variant={
                          campaign.status === "ACTIVE"
                            ? "default"
                            : "secondary"
                        }
                        className={
                          campaign.status === "ACTIVE"
                            ? "bg-green-100 text-green-800"
                            : ""
                        }
                      >
                        {campaign.status}
                      </Badge>
                    </td>
                    <td className="py-3 text-right">
                      {formatCurrency(campaign.spend)}
                    </td>
                    <td className="py-3 text-right">{campaign.conversions}</td>
                    <td className="py-3 text-right font-medium">
                      {campaign.roas.toFixed(1)}x
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getDemoMetrics(): DashboardMetrics {
  const days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  });

  return {
    totalSpend: 24850.0,
    totalImpressions: 1245000,
    totalClicks: 38400,
    totalConversions: 1280,
    avgCtr: 3.08,
    avgRoas: 4.2,
    spendTrend: days.map((date) => ({
      date,
      google: Math.round(300 + Math.random() * 200),
      meta: Math.round(250 + Math.random() * 150),
      total: Math.round(550 + Math.random() * 350),
    })),
    platformBreakdown: [
      { name: "Google Ads", value: 14500 },
      { name: "Meta Ads", value: 10350 },
    ],
    topCampaigns: [
      { id: "1", name: "Brand Awareness - US", platform: "GOOGLE_ADS", spend: 3200, conversions: 156, roas: 5.2, status: "ACTIVE" },
      { id: "2", name: "Lead Gen - California", platform: "META_ADS", spend: 2800, conversions: 98, roas: 4.8, status: "ACTIVE" },
      { id: "3", name: "Product Launch Q1", platform: "GOOGLE_ADS", spend: 2500, conversions: 87, roas: 3.9, status: "ACTIVE" },
      { id: "4", name: "Retargeting - Website Visitors", platform: "META_ADS", spend: 1900, conversions: 112, roas: 6.1, status: "ACTIVE" },
      { id: "5", name: "Search - Competitors", platform: "GOOGLE_ADS", spend: 1600, conversions: 45, roas: 2.8, status: "PAUSED" },
    ],
  };
}
