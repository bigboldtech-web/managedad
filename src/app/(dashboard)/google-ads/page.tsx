"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Target,
  Link2,
  RefreshCw,
  Plus,
  ExternalLink,
  CheckCircle2,
  XCircle,
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
import { formatCurrency, formatNumber } from "@/lib/utils";

interface Connection {
  id: string;
  customerId: string;
  accountName: string | null;
  isActive: boolean;
  lastSyncAt: string | null;
}

interface Campaign {
  id: string;
  name: string;
  status: string;
  dailyBudget: number;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
}

export default function GoogleAdsPage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [connRes, campRes] = await Promise.all([
          fetch("/api/google-ads/connections"),
          fetch("/api/google-ads/campaigns"),
        ]);
        if (connRes.ok) setConnections(await connRes.json());
        if (campRes.ok) setCampaigns(await campRes.json());
      } catch {
        // Use empty state
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const hasConnection = connections.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Google Ads</h1>
          <p className="text-muted-foreground">
            Manage your Google Ads campaigns, ad groups, and keywords.
          </p>
        </div>
        <div className="flex gap-2">
          {hasConnection && (
            <Link href="/google-ads/keywords">
              <Button variant="outline">Manage Keywords</Button>
            </Link>
          )}
          <Link href="/api/google-ads/connect">
            <Button className="gap-2">
              <Link2 className="h-4 w-4" />
              {hasConnection ? "Add Account" : "Connect Google Ads"}
            </Button>
          </Link>
        </div>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Connected Accounts
          </CardTitle>
          <CardDescription>
            Your linked Google Ads accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!hasConnection ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Target className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-semibold">No accounts connected</h3>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Connect your Google Ads account to start managing campaigns,
                tracking performance, and optimizing your ads.
              </p>
              <Link href="/api/google-ads/connect">
                <Button className="mt-4 gap-2">
                  <Link2 className="h-4 w-4" />
                  Connect Google Ads
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {connections.map((conn) => (
                <div
                  key={conn.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-3">
                    {conn.isActive ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive" />
                    )}
                    <div>
                      <p className="font-medium">
                        {conn.accountName || `Account ${conn.customerId}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        ID: {conn.customerId}
                        {conn.lastSyncAt &&
                          ` | Last synced: ${new Date(conn.lastSyncAt).toLocaleString()}`}
                      </p>
                    </div>
                  </div>
                  <Badge variant={conn.isActive ? "default" : "destructive"}>
                    {conn.isActive ? "Active" : "Disconnected"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Campaigns Table */}
      {hasConnection && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Campaigns</CardTitle>
              <CardDescription>Your Google Ads campaigns</CardDescription>
            </div>
            <Link href="/campaigns/new?platform=GOOGLE_ADS">
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                New Campaign
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {campaigns.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                No campaigns yet. Create your first Google Ads campaign.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 font-medium text-muted-foreground">Campaign</th>
                      <th className="pb-3 font-medium text-muted-foreground">Status</th>
                      <th className="pb-3 text-right font-medium text-muted-foreground">Budget/Day</th>
                      <th className="pb-3 text-right font-medium text-muted-foreground">Impressions</th>
                      <th className="pb-3 text-right font-medium text-muted-foreground">Clicks</th>
                      <th className="pb-3 text-right font-medium text-muted-foreground">Conversions</th>
                      <th className="pb-3 text-right font-medium text-muted-foreground">Spend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((campaign) => (
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
                            variant={campaign.status === "ACTIVE" ? "default" : "secondary"}
                            className={campaign.status === "ACTIVE" ? "bg-green-100 text-green-800" : ""}
                          >
                            {campaign.status}
                          </Badge>
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
