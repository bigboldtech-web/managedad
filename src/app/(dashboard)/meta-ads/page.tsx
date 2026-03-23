"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Facebook,
  Link2,
  Plus,
  CheckCircle2,
  XCircle,
  Unlink,
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
import { formatCurrency, formatNumber } from "@/lib/utils";

interface Connection {
  id: string;
  adAccountId: string;
  accountName: string | null;
  isActive: boolean;
  lastSyncAt: string | null;
}

interface Campaign {
  id: string;
  name: string;
  status: string;
  objective: string | null;
  dailyBudget: number;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
}

export default function MetaAdsPage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [showTokenForm, setShowTokenForm] = useState(false);
  const [accessToken, setAccessToken] = useState("");
  const [saving, setSaving] = useState(false);
  const [tokenError, setTokenError] = useState("");

  async function handleSaveToken() {
    if (!accessToken.trim()) return;
    setSaving(true);
    setTokenError("");
    try {
      const res = await fetch("/api/meta-ads/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: accessToken.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTokenError(data.error || "Failed to connect");
        setSaving(false);
        return;
      }
      // Refresh connections
      const connRes = await fetch("/api/meta-ads/connections");
      if (connRes.ok) setConnections(await connRes.json());
      setShowTokenForm(false);
      setAccessToken("");
    } catch {
      setTokenError("Failed to save connection");
    }
    setSaving(false);
  }

  async function handleDisconnect(connectionId: string) {
    setDisconnecting(connectionId);
    try {
      const res = await fetch(`/api/meta-ads/connections?id=${connectionId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setConnections((prev) => prev.filter((c) => c.id !== connectionId));
      }
    } catch (error) {
      console.error("Failed to disconnect:", error);
    }
    setDisconnecting(null);
  }

  useEffect(() => {
    async function fetchData() {
      try {
        const [connRes, campRes] = await Promise.all([
          fetch("/api/meta-ads/connections"),
          fetch("/api/meta-ads/campaigns"),
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
          <h1 className="text-3xl font-bold">Meta Ads</h1>
          <p className="text-muted-foreground">
            Manage your Facebook and Instagram ad campaigns, ad sets, and
            creatives.
          </p>
        </div>
        <div className="flex gap-2">
          {hasConnection && (
            <>
              <Link href="/meta-ads/ad-sets">
                <Button variant="outline">Manage Ad Sets</Button>
              </Link>
              <Link href="/meta-ads/campaigns">
                <Button variant="outline">View Campaigns</Button>
              </Link>
            </>
          )}
          <Link href="/api/meta-ads/connect">
            <Button className="gap-2">
              <Link2 className="h-4 w-4" />
              {hasConnection ? "Add Account" : "Connect Meta Ads"}
            </Button>
          </Link>
        </div>
      </div>

      {/* Manual Token Entry */}
      {showTokenForm && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle>Connect Meta Ads Account</CardTitle>
            <CardDescription>
              Paste your Meta access token from the{" "}
              <a
                href="https://developers.facebook.com/tools/explorer/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                Graph API Explorer
              </a>
              . Make sure to select your ManagedAd app and grant{" "}
              <strong>ads_read</strong> and <strong>ads_management</strong>{" "}
              permissions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Access Token *
              </label>
              <input
                type="text"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="Paste your access token here"
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>
            {tokenError && (
              <p className="text-sm text-red-600">{tokenError}</p>
            )}
            <div className="flex gap-2">
              <Button onClick={handleSaveToken} disabled={saving || !accessToken.trim()}>
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Save Connection
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowTokenForm(false);
                  setAccessToken("");
                  setTokenError("");
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Facebook className="h-5 w-5" />
            Connected Accounts
          </CardTitle>
          <CardDescription>
            Your linked Meta Ads accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!hasConnection ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Facebook className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-semibold">
                No accounts connected
              </h3>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Connect your Meta Ads account to start managing Facebook
                and Instagram campaigns, tracking performance, and
                optimizing your ads.
              </p>
              <Link href="/api/meta-ads/connect">
                <Button className="mt-4 gap-2">
                  <Link2 className="h-4 w-4" />
                  Connect Meta Ads
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
                        {conn.accountName ||
                          `Ad Account ${conn.adAccountId}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        ID: {conn.adAccountId}
                        {conn.lastSyncAt &&
                          ` | Last synced: ${new Date(conn.lastSyncAt).toLocaleString()}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={conn.isActive ? "default" : "destructive"}
                    >
                      {conn.isActive ? "Active" : "Disconnected"}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDisconnect(conn.id)}
                      disabled={disconnecting === conn.id}
                    >
                      {disconnecting === conn.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Unlink className="mr-2 h-4 w-4" />
                      )}
                      Disconnect
                    </Button>
                  </div>
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
              <CardDescription>
                Your Meta Ads campaigns
              </CardDescription>
            </div>
            <Link href="/campaigns/new?platform=META_ADS">
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                New Campaign
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {campaigns.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                No campaigns yet. Create your first Meta Ads campaign.
              </p>
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
                        Conversions
                      </th>
                      <th className="pb-3 text-right font-medium text-muted-foreground">
                        Spend
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((campaign) => (
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
