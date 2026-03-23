"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber } from "@/lib/utils";

interface Campaign {
  id: string;
  name: string;
  status: string;
  objective: string | null;
  dailyBudget: number;
  totalBudget: number | null;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
  startDate: string | null;
  endDate: string | null;
  adGroups: { id: string; name: string; status: string }[];
  _count: { ads: number };
}

export default function MetaCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  async function fetchCampaigns() {
    try {
      const res = await fetch("/api/meta-ads/campaigns");
      if (res.ok) setCampaigns(await res.json());
    } catch {
      // Use empty state
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchCampaigns();
  }, []);

  async function handleSync() {
    setSyncing(true);
    try {
      await fetch("/api/meta-ads/sync", { method: "POST" });
      await fetchCampaigns();
    } catch {
      // Ignore
    }
    setSyncing(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/meta-ads">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Meta Campaigns</h1>
            <p className="text-muted-foreground">
              View and manage all your Meta Ads campaigns.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleSync}
            disabled={syncing}
          >
            <RefreshCw
              className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`}
            />
            {syncing ? "Syncing..." : "Sync from Meta"}
          </Button>
          <Link href="/campaigns/new?platform=META_ADS">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Campaign
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Campaigns</CardTitle>
          <CardDescription>
            {campaigns.length} campaign{campaigns.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-8 text-center text-muted-foreground">
              Loading campaigns...
            </p>
          ) : campaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <h3 className="text-lg font-semibold">No campaigns found</h3>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Create a new campaign or sync your existing Meta Ads
                campaigns.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium text-muted-foreground">
                      Campaign
                    </th>
                    <th className="pb-3 font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="pb-3 font-medium text-muted-foreground">
                      Objective
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
                      Conv.
                    </th>
                    <th className="pb-3 text-right font-medium text-muted-foreground">
                      Spend
                    </th>
                    <th className="pb-3 text-right font-medium text-muted-foreground">
                      ROAS
                    </th>
                    <th className="pb-3 text-right font-medium text-muted-foreground">
                      Ad Sets
                    </th>
                    <th className="pb-3 text-right font-medium text-muted-foreground">
                      Ads
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((campaign) => {
                    const roas =
                      campaign.spend > 0
                        ? campaign.revenue / campaign.spend
                        : 0;
                    return (
                      <tr
                        key={campaign.id}
                        className="border-b last:border-0"
                      >
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
                        <td className="py-3 text-sm text-muted-foreground">
                          {campaign.objective
                            ?.replace("OUTCOME_", "")
                            .replace(/_/g, " ") || "-"}
                        </td>
                        <td className="py-3 text-right">
                          {formatCurrency(campaign.dailyBudget)}
                        </td>
                        <td className="py-3 text-right">
                          {formatNumber(campaign.impressions)}
                        </td>
                        <td className="py-3 text-right">
                          {formatNumber(campaign.clicks)}
                        </td>
                        <td className="py-3 text-right">
                          {campaign.conversions}
                        </td>
                        <td className="py-3 text-right">
                          {formatCurrency(campaign.spend)}
                        </td>
                        <td className="py-3 text-right">
                          {roas.toFixed(2)}x
                        </td>
                        <td className="py-3 text-right">
                          {campaign.adGroups.length}
                        </td>
                        <td className="py-3 text-right">
                          {campaign._count.ads}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
