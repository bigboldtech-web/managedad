"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  DollarSign,
  Eye,
  MousePointerClick,
  Target,
  TrendingUp,
  TrendingDown,
  Users,
  BarChart3,
  RefreshCw,
  Link2,
  Unlink,
  Loader2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
  Legend,
} from "recharts";

type DateRange = "7d" | "14d" | "30d" | "90d";

interface Connection {
  id: string;
  adAccountId: string;
  accountName: string | null;
  isActive: boolean;
  lastSyncAt: string | null;
}

interface Summary {
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalReach: number;
  totalConversions: number;
  totalRevenue: number;
  avgCtr: number;
  avgCpc: number;
  costPerResult: number;
  avgRoas: number;
}

interface DailyTrend {
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  reach: number;
  ctr: number;
  cpc: number;
}

interface CampaignData {
  id: string;
  name: string;
  status: string;
  objective: string;
  dailyBudget: number;
  impressions: number;
  clicks: number;
  reach: number;
  conversions: number;
  spend: number;
  revenue: number;
  ctr: number;
  cpc: number;
  cpa: number;
  roas: number;
  costPerResult: number;
}

interface OverviewData {
  summary: Summary;
  previousPeriod: Summary;
  dailyTrend: DailyTrend[];
  campaigns: CampaignData[];
}

type SortField = keyof CampaignData;
type StatusFilter = "all" | "ACTIVE" | "PAUSED";

function calcChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return ((current - previous) / previous) * 100;
}

function TrendIndicator({ change }: { change: number | null }) {
  if (change === null) return null;
  const isPositive = change >= 0;
  return (
    <span
      className={`flex items-center gap-0.5 text-xs font-medium ${
        isPositive ? "text-green-600" : "text-red-600"
      }`}
    >
      {isPositive ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      {Math.abs(change).toFixed(1)}%
    </span>
  );
}

export default function MetaAdsPage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [range, setRange] = useState<DateRange>("7d");
  const [sortField, setSortField] = useState<SortField>("spend");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    fetchConnections();
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [range]);

  async function fetchConnections() {
    try {
      const res = await fetch("/api/meta-ads/connections");
      if (res.ok) setConnections(await res.json());
    } catch (error) {
      console.error("Failed to fetch connections:", error);
    }
  }

  async function fetchOverview() {
    setLoading(true);
    try {
      const res = await fetch(`/api/meta-ads/overview?range=${range}`);
      if (res.ok) setOverview(await res.json());
    } catch (error) {
      console.error("Failed to fetch overview:", error);
    }
    setLoading(false);
  }

  async function handleSync() {
    setSyncing(true);
    try {
      await fetch("/api/meta-ads/sync", { method: "POST" });
      await fetchOverview();
      await fetchConnections();
    } catch (error) {
      console.error("Sync failed:", error);
    }
    setSyncing(false);
  }

  async function handleDisconnect(connectionId: string) {
    setDisconnecting(connectionId);
    try {
      const res = await fetch(
        `/api/meta-ads/connections?id=${connectionId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setConnections((prev) => prev.filter((c) => c.id !== connectionId));
        await fetchOverview();
      }
    } catch (error) {
      console.error("Disconnect failed:", error);
    }
    setDisconnecting(null);
  }

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  }

  const hasConnection = connections.some((c) => c.isActive);
  const activeConnection = connections.find((c) => c.isActive);

  const s = overview?.summary;
  const prev = overview?.previousPeriod;

  const sortedCampaigns = (overview?.campaigns || [])
    .filter((c) => statusFilter === "all" || c.status === statusFilter)
    .sort((a, b) => {
      const aVal = a[sortField] ?? 0;
      const bVal = b[sortField] ?? 0;
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDir === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      return sortDir === "asc"
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });

  const kpiCards = s && prev
    ? [
        { title: "Total Spend", value: formatCurrency(s.totalSpend), change: calcChange(s.totalSpend, prev.totalSpend), icon: DollarSign, invertColor: true },
        { title: "Impressions", value: formatCompactNumber(s.totalImpressions), change: calcChange(s.totalImpressions, prev.totalImpressions), icon: Eye },
        { title: "Reach", value: formatCompactNumber(s.totalReach), change: calcChange(s.totalReach, prev.totalReach), icon: Users },
        { title: "Clicks", value: formatCompactNumber(s.totalClicks), change: calcChange(s.totalClicks, prev.totalClicks), icon: MousePointerClick },
        { title: "CTR", value: formatPercent(s.avgCtr), change: calcChange(s.avgCtr, prev.avgCtr), icon: BarChart3 },
        { title: "Conversions", value: formatNumber(s.totalConversions), change: calcChange(s.totalConversions, prev.totalConversions), icon: Target },
        { title: "Cost per Result", value: formatCurrency(s.costPerResult), change: calcChange(s.costPerResult, prev.costPerResult), icon: Zap, invertColor: true },
        { title: "ROAS", value: `${s.avgRoas.toFixed(2)}x`, change: calcChange(s.avgRoas, prev.avgRoas), icon: TrendingUp },
      ]
    : [];

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
    return sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Meta Ads</h1>
          {activeConnection && (
            <p className="text-sm text-muted-foreground mt-1">
              Connected: {activeConnection.accountName || activeConnection.adAccountId}
              {activeConnection.lastSyncAt && (
                <> | Last synced: {new Date(activeConnection.lastSyncAt).toLocaleString()}</>
              )}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {hasConnection && (
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              {(["7d", "14d", "30d", "90d"] as DateRange[]).map((r) => (
                <Button key={r} variant={range === r ? "default" : "ghost"} size="sm" onClick={() => setRange(r)} className="h-7 px-3 text-xs">
                  {r}
                </Button>
              ))}
            </div>
          )}
          {hasConnection && (
            <Button variant="outline" size="sm" className="gap-2" onClick={handleSync} disabled={syncing}>
              <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Syncing..." : "Sync"}
            </Button>
          )}
          <Link href="/api/meta-ads/connect">
            <Button size="sm" className="gap-2">
              <Link2 className="h-4 w-4" />
              {hasConnection ? "Add Account" : "Connect Meta Ads"}
            </Button>
          </Link>
        </div>
      </div>

      {/* Empty State */}
      {!hasConnection && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-blue-100 p-4 mb-4">
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold">Connect Your Meta Ads Account</h3>
            <p className="text-muted-foreground text-sm mt-1 mb-4 text-center max-w-md">
              Link your Facebook/Instagram ad accounts to see campaigns, metrics, and optimization recommendations.
            </p>
            <Link href="/api/meta-ads/connect">
              <Button className="gap-2">
                <Link2 className="h-4 w-4" />
                Connect Meta Ads
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {loading && hasConnection && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Dashboard Content */}
      {hasConnection && !loading && overview && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {kpiCards.map((kpi) => (
              <Card key={kpi.title}>
                <CardContent className="pt-4 pb-3 px-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-muted-foreground">{kpi.title}</span>
                    <kpi.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-2xl font-bold">{kpi.value}</div>
                  <div className="mt-1">
                    {kpi.invertColor && kpi.change !== null ? (
                      <span className={`flex items-center gap-0.5 text-xs font-medium ${kpi.change <= 0 ? "text-green-600" : "text-red-600"}`}>
                        {kpi.change <= 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                        {Math.abs(kpi.change).toFixed(1)}% vs prev
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <TrendIndicator change={kpi.change} />
                        {kpi.change !== null && <span className="text-xs text-muted-foreground">vs prev</span>}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts */}
          {overview.dailyTrend.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Spend & Conversions</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={overview.dailyTrend}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })} tick={{ fontSize: 11 }} />
                      <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                      <Tooltip
                        formatter={(value: any, name: any) => name === "Spend" ? [`$${Number(value).toFixed(2)}`, "Spend"] : [value, "Conversions"]}
                        labelFormatter={(label: any) => new Date(label).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                      />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="spend" name="Spend" stroke="#1877F2" strokeWidth={2} dot={false} />
                      <Line yAxisId="right" type="monotone" dataKey="conversions" name="Conversions" stroke="#10b981" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Efficiency Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={overview.dailyTrend}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })} tick={{ fontSize: 11 }} />
                      <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v.toFixed(1)}%`} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                      <Tooltip
                        formatter={(value: any, name: any) => name === "CTR" ? [`${Number(value).toFixed(2)}%`, "CTR"] : [`$${Number(value).toFixed(2)}`, "CPC"]}
                        labelFormatter={(label: any) => new Date(label).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                      />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="ctr" name="CTR" stroke="#6366f1" strokeWidth={2} dot={false} />
                      <Line yAxisId="right" type="monotone" dataKey="cpc" name="CPC" stroke="#f59e0b" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Campaigns Table */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Campaigns</CardTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {sortedCampaigns.length} campaign{sortedCampaigns.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {(["all", "ACTIVE", "PAUSED"] as StatusFilter[]).map((f) => (
                    <Button key={f} variant={statusFilter === f ? "default" : "outline"} size="sm" className="h-7 text-xs" onClick={() => setStatusFilter(f)}>
                      {f === "all" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left px-4 py-2 font-medium">Campaign</th>
                      <th className="text-left px-3 py-2 font-medium">Delivery</th>
                      <th className="text-left px-3 py-2 font-medium">Objective</th>
                      {[
                        { field: "conversions" as SortField, label: "Results" },
                        { field: "costPerResult" as SortField, label: "Cost/Result" },
                        { field: "dailyBudget" as SortField, label: "Budget" },
                        { field: "spend" as SortField, label: "Spent" },
                        { field: "impressions" as SortField, label: "Impr." },
                        { field: "reach" as SortField, label: "Reach" },
                        { field: "clicks" as SortField, label: "Clicks" },
                        { field: "ctr" as SortField, label: "CTR" },
                        { field: "roas" as SortField, label: "ROAS" },
                      ].map(({ field, label }) => (
                        <th key={field} className="text-right px-3 py-2 font-medium cursor-pointer select-none" onClick={() => handleSort(field)}>
                          <span className="inline-flex items-center gap-1">{label} <SortIcon field={field} /></span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedCampaigns.map((c) => (
                      <tr key={c.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <Link href={`/campaigns/${c.id}`} className="font-medium text-blue-600 hover:underline">
                            {c.name}
                          </Link>
                        </td>
                        <td className="px-3 py-3">
                          <Badge variant={c.status === "ACTIVE" ? "default" : "secondary"} className={c.status === "ACTIVE" ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}>
                            {c.status === "ACTIVE" ? "Active" : "Paused"}
                          </Badge>
                        </td>
                        <td className="px-3 py-3 text-muted-foreground text-xs">
                          {(c.objective || "—").replace("OUTCOME_", "").replace(/_/g, " ")}
                        </td>
                        <td className="px-3 py-3 text-right font-medium">{c.conversions > 0 ? formatNumber(c.conversions) : "—"}</td>
                        <td className="px-3 py-3 text-right">{c.costPerResult > 0 ? formatCurrency(c.costPerResult) : "—"}</td>
                        <td className="px-3 py-3 text-right">{c.dailyBudget > 0 ? `${formatCurrency(c.dailyBudget)}/day` : "—"}</td>
                        <td className="px-3 py-3 text-right font-medium">{formatCurrency(c.spend)}</td>
                        <td className="px-3 py-3 text-right">{formatCompactNumber(c.impressions)}</td>
                        <td className="px-3 py-3 text-right">{formatCompactNumber(c.reach)}</td>
                        <td className="px-3 py-3 text-right">{formatCompactNumber(c.clicks)}</td>
                        <td className="px-3 py-3 text-right">{c.ctr > 0 ? formatPercent(c.ctr) : "—"}</td>
                        <td className="px-3 py-3 text-right">{c.roas > 0 ? `${c.roas.toFixed(2)}x` : "—"}</td>
                      </tr>
                    ))}
                    {sortedCampaigns.length === 0 && (
                      <tr>
                        <td colSpan={12} className="text-center py-8 text-muted-foreground">No campaigns found for the selected filter.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Connected Accounts */}
          {connections.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Connected Accounts ({connections.filter((c) => c.isActive).length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {connections.filter((c) => c.isActive).map((c) => (
                    <div key={c.id} className="flex items-center gap-2 text-sm border rounded-lg px-3 py-2">
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                      <span className="font-medium">{c.accountName || c.adAccountId}</span>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" disabled={disconnecting === c.id} onClick={() => handleDisconnect(c.id)}>
                        {disconnecting === c.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Unlink className="h-3 w-3" />}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
