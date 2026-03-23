"use client";

import { useEffect, useState } from "react";
import {
  DollarSign,
  Eye,
  MousePointerClick,
  Target,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatCompactNumber,
} from "@/lib/utils";
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
  Legend,
} from "recharts";

type DateRange = "7d" | "30d" | "90d";

interface AnalyticsData {
  metrics: {
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number;
    cpc: number;
    cpa: number;
  };
  timeSeries: {
    date: string;
    googleSpend: number;
    metaSpend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number;
    cpc: number;
    cpa: number;
  }[];
  topCampaigns: {
    id: string;
    name: string;
    platform: string;
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number;
    roas: number;
  }[];
}

function generateDemoData(range: DateRange): AnalyticsData {
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const timeSeries = Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - i));
    const googleSpend = Math.round(200 + Math.random() * 300);
    const metaSpend = Math.round(150 + Math.random() * 250);
    const impressions = Math.round(15000 + Math.random() * 10000);
    const clicks = Math.round(impressions * (0.02 + Math.random() * 0.03));
    const conversions = Math.round(clicks * (0.03 + Math.random() * 0.04));
    const ctr = (clicks / impressions) * 100;
    const totalSpend = googleSpend + metaSpend;
    const cpc = totalSpend / clicks;
    const cpa = conversions > 0 ? totalSpend / conversions : 0;

    return {
      date: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      googleSpend,
      metaSpend,
      impressions,
      clicks,
      conversions,
      ctr: parseFloat(ctr.toFixed(2)),
      cpc: parseFloat(cpc.toFixed(2)),
      cpa: parseFloat(cpa.toFixed(2)),
    };
  });

  const totalSpend = timeSeries.reduce(
    (s, d) => s + d.googleSpend + d.metaSpend,
    0
  );
  const totalImpressions = timeSeries.reduce((s, d) => s + d.impressions, 0);
  const totalClicks = timeSeries.reduce((s, d) => s + d.clicks, 0);
  const totalConversions = timeSeries.reduce((s, d) => s + d.conversions, 0);

  return {
    metrics: {
      spend: totalSpend,
      impressions: totalImpressions,
      clicks: totalClicks,
      conversions: totalConversions,
      ctr: (totalClicks / totalImpressions) * 100,
      cpc: totalSpend / totalClicks,
      cpa: totalConversions > 0 ? totalSpend / totalConversions : 0,
    },
    timeSeries,
    topCampaigns: [
      { id: "1", name: "Brand Awareness - US", platform: "GOOGLE_ADS", spend: 4200, impressions: 320000, clicks: 9600, conversions: 384, ctr: 3.0, roas: 5.1 },
      { id: "2", name: "Lead Gen - California", platform: "META_ADS", spend: 3600, impressions: 280000, clicks: 8400, conversions: 252, ctr: 3.0, roas: 4.6 },
      { id: "3", name: "Product Launch Q1", platform: "GOOGLE_ADS", spend: 3100, impressions: 210000, clicks: 6300, conversions: 189, ctr: 3.0, roas: 3.8 },
      { id: "4", name: "Retargeting - Visitors", platform: "META_ADS", spend: 2400, impressions: 160000, clicks: 6400, conversions: 288, ctr: 4.0, roas: 6.2 },
      { id: "5", name: "Search - Competitors", platform: "GOOGLE_ADS", spend: 1800, impressions: 95000, clicks: 2850, conversions: 85, ctr: 3.0, roas: 2.7 },
    ],
  };
}

export default function AnalyticsPage() {
  const [range, setRange] = useState<DateRange>("30d");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // Use demo data; in production, fetch from /api/analytics?range=...
    const timer = setTimeout(() => {
      setData(generateDemoData(range));
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [range]);

  if (loading || !data) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const kpis = [
    {
      title: "Total Spend",
      value: formatCurrency(data.metrics.spend),
      icon: DollarSign,
    },
    {
      title: "Impressions",
      value: formatCompactNumber(data.metrics.impressions),
      icon: Eye,
    },
    {
      title: "Clicks",
      value: formatCompactNumber(data.metrics.clicks),
      icon: MousePointerClick,
    },
    {
      title: "Conversions",
      value: formatNumber(data.metrics.conversions),
      icon: Target,
    },
    {
      title: "CTR",
      value: formatPercent(data.metrics.ctr),
      icon: TrendingUp,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            Deep-dive into your advertising performance.
          </p>
        </div>
        <div className="flex gap-2">
          {(["7d", "30d", "90d"] as DateRange[]).map((r) => (
            <Button
              key={r}
              variant={range === r ? "default" : "outline"}
              size="sm"
              onClick={() => setRange(r)}
            >
              {r}
            </Button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
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
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Platform Comparison - Spend */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Comparison - Spend</CardTitle>
          <CardDescription>Google Ads vs Meta Ads daily spend</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.timeSeries}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="googleSpend"
                  name="Google Ads"
                  fill="#4285F4"
                  radius={[2, 2, 0, 0]}
                  stackId="spend"
                />
                <Bar
                  dataKey="metaSpend"
                  name="Meta Ads"
                  fill="#1877F2"
                  radius={[2, 2, 0, 0]}
                  stackId="spend"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Over Time */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Impressions & Clicks</CardTitle>
            <CardDescription>Volume trends over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.timeSeries}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="impressions"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={false}
                    name="Impressions"
                  />
                  <Line
                    type="monotone"
                    dataKey="clicks"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                    name="Clicks"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conversions</CardTitle>
            <CardDescription>Daily conversion count</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.timeSeries}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} allowDecimals={false} />
                  <Tooltip />
                  <Bar
                    dataKey="conversions"
                    fill="#f59e0b"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CTR / CPC / CPA Trend Lines */}
      <Card>
        <CardHeader>
          <CardTitle>Efficiency Metrics</CardTitle>
          <CardDescription>CTR, CPC, and CPA trend lines</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.timeSeries}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis yAxisId="left" fontSize={12} />
                <YAxis yAxisId="right" orientation="right" fontSize={12} />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="ctr"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={false}
                  name="CTR (%)"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="cpc"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  name="CPC ($)"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="cpa"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  name="CPA ($)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Best Performing Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle>Best Performing Campaigns</CardTitle>
          <CardDescription>
            Top campaigns ranked by ROAS
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 font-medium text-muted-foreground">Campaign</th>
                  <th className="pb-3 font-medium text-muted-foreground">Platform</th>
                  <th className="pb-3 text-right font-medium text-muted-foreground">Spend</th>
                  <th className="pb-3 text-right font-medium text-muted-foreground">Impressions</th>
                  <th className="pb-3 text-right font-medium text-muted-foreground">Clicks</th>
                  <th className="pb-3 text-right font-medium text-muted-foreground">Conversions</th>
                  <th className="pb-3 text-right font-medium text-muted-foreground">CTR</th>
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
                        {campaign.platform === "GOOGLE_ADS" ? "Google" : "Meta"}
                      </Badge>
                    </td>
                    <td className="py-3 text-right">
                      {formatCurrency(campaign.spend)}
                    </td>
                    <td className="py-3 text-right">
                      {formatCompactNumber(campaign.impressions)}
                    </td>
                    <td className="py-3 text-right">
                      {formatCompactNumber(campaign.clicks)}
                    </td>
                    <td className="py-3 text-right">{campaign.conversions}</td>
                    <td className="py-3 text-right">
                      {formatPercent(campaign.ctr)}
                    </td>
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
