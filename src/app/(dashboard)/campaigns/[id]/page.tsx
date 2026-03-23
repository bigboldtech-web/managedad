"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  DollarSign,
  Eye,
  MousePointerClick,
  Target,
  TrendingUp,
  Pause,
  Play,
  Pencil,
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
import { Separator } from "@/components/ui/separator";
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
} from "recharts";

interface CampaignDetail {
  id: string;
  name: string;
  platform: "GOOGLE_ADS" | "META_ADS";
  status: string;
  objective: string | null;
  dailyBudget: number;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
  createdAt: string;
  ads: {
    id: string;
    name: string | null;
    type: string;
    status: string;
    impressions: number;
    clicks: number;
    conversions: number;
    spend: number;
  }[];
  keywords: {
    id: string;
    text: string;
    matchType: string;
    status: string;
    qualityScore: number | null;
    impressions: number;
    clicks: number;
    conversions: number;
    spend: number;
  }[];
  dailyMetrics: {
    date: string;
    impressions: number;
    clicks: number;
    spend: number;
    conversions: number;
  }[];
}

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const campaignId = params.id as string;

  useEffect(() => {
    async function fetchCampaign() {
      try {
        const res = await fetch(`/api/campaigns?id=${campaignId}`);
        if (res.ok) {
          const data = await res.json();
          setCampaign(data);
        }
      } catch {
        // handle error
      }
      setLoading(false);
    }
    fetchCampaign();
  }, [campaignId]);

  const handleStatusChange = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/campaigns?id=${campaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setCampaign((prev) => (prev ? { ...prev, status: updated.status } : prev));
      }
    } catch {
      // handle error
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Loading campaign...</p>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-xl font-semibold">Campaign not found</h2>
        <Link href="/campaigns">
          <Button variant="outline" className="mt-4">
            Back to Campaigns
          </Button>
        </Link>
      </div>
    );
  }

  const ctr =
    Number(campaign.impressions) > 0
      ? (Number(campaign.clicks) / Number(campaign.impressions)) * 100
      : 0;
  const roas =
    Number(campaign.spend) > 0
      ? Number(campaign.revenue) / Number(campaign.spend)
      : 0;

  const kpis = [
    {
      title: "Impressions",
      value: formatCompactNumber(Number(campaign.impressions)),
      icon: Eye,
    },
    {
      title: "Clicks",
      value: formatCompactNumber(Number(campaign.clicks)),
      icon: MousePointerClick,
    },
    {
      title: "CTR",
      value: formatPercent(ctr),
      icon: TrendingUp,
    },
    {
      title: "Conversions",
      value: formatNumber(campaign.conversions),
      icon: Target,
    },
    {
      title: "Spend",
      value: formatCurrency(Number(campaign.spend)),
      icon: DollarSign,
    },
    {
      title: "ROAS",
      value: `${roas.toFixed(1)}x`,
      icon: TrendingUp,
    },
  ];

  const chartData = (campaign.dailyMetrics || []).map((m) => ({
    date: new Date(m.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    impressions: Number(m.impressions),
    clicks: Number(m.clicks),
    spend: Number(m.spend),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{campaign.name}</h1>
              <Badge
                variant={
                  campaign.platform === "GOOGLE_ADS" ? "default" : "secondary"
                }
              >
                {campaign.platform === "GOOGLE_ADS" ? "Google" : "Meta"}
              </Badge>
              <Badge
                variant={
                  campaign.status === "ACTIVE" ? "default" : "secondary"
                }
                className={
                  campaign.status === "ACTIVE"
                    ? "bg-green-100 text-green-800"
                    : ""
                }
              >
                {campaign.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {campaign.objective} &middot; Budget:{" "}
              {formatCurrency(Number(campaign.dailyBudget))}/day
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {campaign.status === "ACTIVE" ? (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => handleStatusChange("PAUSED")}
            >
              <Pause className="h-4 w-4" />
              Pause
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => handleStatusChange("ACTIVE")}
            >
              <Play className="h-4 w-4" />
              Activate
            </Button>
          )}
          <Button variant="outline" size="sm" className="gap-2">
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
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

      {/* Daily Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Performance</CardTitle>
          <CardDescription>
            Impressions, clicks, and spend over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="opacity-30"
                  />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
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
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    name="Clicks"
                  />
                  <Line
                    type="monotone"
                    dataKey="spend"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                    name="Spend ($)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-8 text-center text-muted-foreground">
              No performance data available yet.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Ads Table */}
      <Card>
        <CardHeader>
          <CardTitle>Ads</CardTitle>
          <CardDescription>
            All ads in this campaign
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(campaign.ads || []).length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No ads in this campaign yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium text-muted-foreground">
                      Ad
                    </th>
                    <th className="pb-3 font-medium text-muted-foreground">
                      Type
                    </th>
                    <th className="pb-3 font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="pb-3 text-right font-medium text-muted-foreground">
                      Impressions
                    </th>
                    <th className="pb-3 text-right font-medium text-muted-foreground">
                      Clicks
                    </th>
                    <th className="pb-3 text-right font-medium text-muted-foreground">
                      Conversions
                    </th>
                    <th className="pb-3 text-right font-medium text-muted-foreground">
                      Spend
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {campaign.ads.map((ad) => (
                    <tr key={ad.id} className="border-b last:border-0">
                      <td className="py-3 font-medium">
                        {ad.name || "Untitled Ad"}
                      </td>
                      <td className="py-3">
                        <Badge variant="outline">{ad.type}</Badge>
                      </td>
                      <td className="py-3">
                        <Badge
                          variant={
                            ad.status === "ACTIVE" ? "default" : "secondary"
                          }
                          className={
                            ad.status === "ACTIVE"
                              ? "bg-green-100 text-green-800"
                              : ""
                          }
                        >
                          {ad.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-right">
                        {formatNumber(Number(ad.impressions))}
                      </td>
                      <td className="py-3 text-right">
                        {formatNumber(Number(ad.clicks))}
                      </td>
                      <td className="py-3 text-right">{ad.conversions}</td>
                      <td className="py-3 text-right">
                        {formatCurrency(Number(ad.spend))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Keywords Table (Google Ads only) */}
      {campaign.platform === "GOOGLE_ADS" && (
        <Card>
          <CardHeader>
            <CardTitle>Keywords</CardTitle>
            <CardDescription>
              Keywords targeting for this campaign
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(campaign.keywords || []).length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                No keywords in this campaign yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 font-medium text-muted-foreground">
                        Keyword
                      </th>
                      <th className="pb-3 font-medium text-muted-foreground">
                        Match Type
                      </th>
                      <th className="pb-3 font-medium text-muted-foreground">
                        Status
                      </th>
                      <th className="pb-3 text-right font-medium text-muted-foreground">
                        Quality
                      </th>
                      <th className="pb-3 text-right font-medium text-muted-foreground">
                        Impressions
                      </th>
                      <th className="pb-3 text-right font-medium text-muted-foreground">
                        Clicks
                      </th>
                      <th className="pb-3 text-right font-medium text-muted-foreground">
                        Conv.
                      </th>
                      <th className="pb-3 text-right font-medium text-muted-foreground">
                        Spend
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaign.keywords.map((kw) => (
                      <tr key={kw.id} className="border-b last:border-0">
                        <td className="py-3 font-medium">{kw.text}</td>
                        <td className="py-3">
                          <Badge variant="outline">{kw.matchType}</Badge>
                        </td>
                        <td className="py-3">
                          <Badge
                            variant={
                              kw.status === "ACTIVE" ? "default" : "secondary"
                            }
                            className={
                              kw.status === "ACTIVE"
                                ? "bg-green-100 text-green-800"
                                : ""
                            }
                          >
                            {kw.status}
                          </Badge>
                        </td>
                        <td className="py-3 text-right">
                          {kw.qualityScore ?? "-"}
                        </td>
                        <td className="py-3 text-right">
                          {formatNumber(Number(kw.impressions))}
                        </td>
                        <td className="py-3 text-right">
                          {formatNumber(Number(kw.clicks))}
                        </td>
                        <td className="py-3 text-right">{kw.conversions}</td>
                        <td className="py-3 text-right">
                          {formatCurrency(Number(kw.spend))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
