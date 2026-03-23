"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
} from "@/lib/utils";

interface Campaign {
  id: string;
  name: string;
  platform: "GOOGLE_ADS" | "META_ADS";
  status: string;
  dailyBudget: number;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
}

type PlatformFilter = "ALL" | "GOOGLE_ADS" | "META_ADS";
type StatusFilter = "ALL" | "ACTIVE" | "PAUSED" | "DRAFT" | "ENDED";

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchCampaigns() {
      try {
        const res = await fetch("/api/campaigns");
        if (res.ok) {
          const data = await res.json();
          setCampaigns(data);
        }
      } catch {
        // empty state
      }
      setLoading(false);
    }
    fetchCampaigns();
  }, []);

  const filtered = campaigns.filter((c) => {
    if (platformFilter !== "ALL" && c.platform !== platformFilter) return false;
    if (statusFilter !== "ALL" && c.status !== statusFilter) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  const getRoas = (c: Campaign) => {
    if (Number(c.spend) === 0) return 0;
    return Number(c.revenue) / Number(c.spend);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Campaigns</h1>
          <p className="text-muted-foreground">
            Manage all your campaigns across Google Ads and Meta Ads.
          </p>
        </div>
        <Link href="/campaigns/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Campaign
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            <div className="flex gap-2">
              {(["ALL", "GOOGLE_ADS", "META_ADS"] as PlatformFilter[]).map(
                (p) => (
                  <Button
                    key={p}
                    variant={platformFilter === p ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPlatformFilter(p)}
                  >
                    {p === "ALL"
                      ? "All Platforms"
                      : p === "GOOGLE_ADS"
                        ? "Google Ads"
                        : "Meta Ads"}
                  </Button>
                )
              )}
            </div>
            <div className="flex gap-2">
              {(
                ["ALL", "ACTIVE", "PAUSED", "DRAFT", "ENDED"] as StatusFilter[]
              ).map((s) => (
                <Button
                  key={s}
                  variant={statusFilter === s ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(s)}
                >
                  {s === "ALL" ? "All Statuses" : s}
                </Button>
              ))}
            </div>
            <Input
              placeholder="Search campaigns..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Campaigns</CardTitle>
          <CardDescription>
            {filtered.length} campaign{filtered.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-8 text-center text-muted-foreground">
              Loading campaigns...
            </p>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <h3 className="text-lg font-semibold">No campaigns found</h3>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                {campaigns.length === 0
                  ? "Create your first campaign to get started."
                  : "No campaigns match your current filters."}
              </p>
              {campaigns.length === 0 && (
                <Link href="/campaigns/new">
                  <Button className="mt-4 gap-2">
                    <Plus className="h-4 w-4" />
                    New Campaign
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium text-muted-foreground">
                      Name
                    </th>
                    <th className="pb-3 font-medium text-muted-foreground">
                      Platform
                    </th>
                    <th className="pb-3 font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="pb-3 text-right font-medium text-muted-foreground">
                      Budget/Day
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
                    <th className="pb-3 text-right font-medium text-muted-foreground">
                      ROAS
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((campaign) => (
                    <tr key={campaign.id} className="border-b last:border-0">
                      <td className="py-3">
                        <Link
                          href={`/campaigns/${campaign.id}`}
                          className="font-medium hover:underline"
                        >
                          {campaign.name}
                        </Link>
                      </td>
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
                        {formatCurrency(Number(campaign.dailyBudget))}
                      </td>
                      <td className="py-3 text-right">
                        {formatNumber(Number(campaign.impressions))}
                      </td>
                      <td className="py-3 text-right">
                        {formatNumber(Number(campaign.clicks))}
                      </td>
                      <td className="py-3 text-right">
                        {campaign.conversions}
                      </td>
                      <td className="py-3 text-right">
                        {formatCurrency(Number(campaign.spend))}
                      </td>
                      <td className="py-3 text-right font-medium">
                        {getRoas(campaign).toFixed(1)}x
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
