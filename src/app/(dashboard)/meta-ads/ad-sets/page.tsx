"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw } from "lucide-react";
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

interface AdSet {
  id: string;
  name: string;
  status: string;
  bidAmount: number | null;
  bidStrategy: string | null;
  targeting: {
    age_min?: number;
    age_max?: number;
    geo_locations?: {
      countries?: string[];
    };
  } | null;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  campaign: {
    id: string;
    name: string;
  };
}

export default function MetaAdSetsPage() {
  const [adSets, setAdSets] = useState<AdSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  async function fetchAdSets() {
    try {
      const res = await fetch("/api/meta-ads/ad-sets");
      if (res.ok) setAdSets(await res.json());
    } catch {
      // Use empty state
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchAdSets();
  }, []);

  async function handleSync() {
    setSyncing(true);
    try {
      await fetch("/api/meta-ads/sync", { method: "POST" });
      await fetchAdSets();
    } catch {
      // Ignore
    }
    setSyncing(false);
  }

  function formatTargeting(
    targeting: AdSet["targeting"]
  ): string {
    if (!targeting) return "-";
    const parts: string[] = [];
    if (targeting.age_min || targeting.age_max) {
      parts.push(
        `Ages ${targeting.age_min || 18}-${targeting.age_max || 65}`
      );
    }
    if (targeting.geo_locations?.countries?.length) {
      parts.push(targeting.geo_locations.countries.join(", "));
    }
    return parts.length > 0 ? parts.join(" | ") : "-";
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
            <h1 className="text-3xl font-bold">Ad Sets</h1>
            <p className="text-muted-foreground">
              Manage targeting, budgets, and schedules for your Meta ad
              sets.
            </p>
          </div>
        </div>
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Ad Sets</CardTitle>
          <CardDescription>
            {adSets.length} ad set{adSets.length !== 1 ? "s" : ""} across
            all campaigns
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-8 text-center text-muted-foreground">
              Loading ad sets...
            </p>
          ) : adSets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <h3 className="text-lg font-semibold">No ad sets found</h3>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Ad sets will appear here once you sync your Meta Ads
                account or create campaigns with ad sets.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium text-muted-foreground">
                      Ad Set
                    </th>
                    <th className="pb-3 font-medium text-muted-foreground">
                      Campaign
                    </th>
                    <th className="pb-3 font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="pb-3 font-medium text-muted-foreground">
                      Targeting
                    </th>
                    <th className="pb-3 text-right font-medium text-muted-foreground">
                      Bid
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
                  {adSets.map((adSet) => (
                    <tr
                      key={adSet.id}
                      className="border-b last:border-0"
                    >
                      <td className="py-3 font-medium">
                        {adSet.name}
                      </td>
                      <td className="py-3">
                        <Link
                          href={`/campaigns/${adSet.campaign.id}`}
                          className="text-sm hover:underline"
                        >
                          {adSet.campaign.name}
                        </Link>
                      </td>
                      <td className="py-3">
                        <Badge
                          variant={
                            adSet.status === "ACTIVE"
                              ? "default"
                              : "secondary"
                          }
                          className={
                            adSet.status === "ACTIVE"
                              ? "bg-green-100 text-green-800"
                              : ""
                          }
                        >
                          {adSet.status}
                        </Badge>
                      </td>
                      <td className="max-w-[200px] truncate py-3 text-sm text-muted-foreground">
                        {formatTargeting(adSet.targeting)}
                      </td>
                      <td className="py-3 text-right">
                        {adSet.bidAmount
                          ? formatCurrency(adSet.bidAmount)
                          : adSet.bidStrategy || "-"}
                      </td>
                      <td className="py-3 text-right">
                        {formatNumber(adSet.impressions)}
                      </td>
                      <td className="py-3 text-right">
                        {formatNumber(adSet.clicks)}
                      </td>
                      <td className="py-3 text-right">
                        {adSet.conversions}
                      </td>
                      <td className="py-3 text-right">
                        {formatCurrency(adSet.spend)}
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
