"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Target,
  Link2,
  RefreshCw,
  Plus,
  ExternalLink,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

function GoogleAdsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [showCustomerIdForm, setShowCustomerIdForm] = useState(false);
  const [customerIdInput, setCustomerIdInput] = useState("");
  const [accountNameInput, setAccountNameInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (searchParams.get("setup") === "enter_customer_id") {
      setShowCustomerIdForm(true);
    }
  }, [searchParams]);

  async function handleSaveCustomerId() {
    const sanitized = customerIdInput.replace(/[-\s]/g, "");
    if (!/^\d{3,10}$/.test(sanitized)) {
      setFormError("Enter a valid Google Ads Customer ID (e.g., 123-456-7890)");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const res = await fetch("/api/google-ads/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: sanitized,
          accountName: accountNameInput || null,
        }),
      });
      if (res.ok) {
        setShowCustomerIdForm(false);
        setCustomerIdInput("");
        setAccountNameInput("");
        router.replace("/google-ads?connected=true");
        // Refresh connections
        const connRes = await fetch("/api/google-ads/connections");
        if (connRes.ok) setConnections(await connRes.json());
      } else {
        const data = await res.json();
        setFormError(data.error || "Failed to save connection");
      }
    } catch {
      setFormError("Failed to save connection");
    }
    setSaving(false);
  }

  async function handleDisconnect(connectionId: string) {
    setDisconnecting(connectionId);
    try {
      const res = await fetch(`/api/google-ads/connections?id=${connectionId}`, {
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
      {/* Customer ID Entry Dialog */}
      {showCustomerIdForm && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle>Enter Your Google Ads Customer ID</CardTitle>
            <CardDescription>
              Google account connected successfully! Now enter your Google Ads
              Customer ID to complete the setup. You can find it in the top-right
              corner of your Google Ads dashboard (format: 123-456-7890).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customerId">Customer ID *</Label>
                <Input
                  id="customerId"
                  placeholder="123-456-7890"
                  value={customerIdInput}
                  onChange={(e) => setCustomerIdInput(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountName">Account Name (optional)</Label>
                <Input
                  id="accountName"
                  placeholder="My Business Account"
                  value={accountNameInput}
                  onChange={(e) => setAccountNameInput(e.target.value)}
                />
              </div>
              {formError && (
                <p className="text-sm text-destructive">{formError}</p>
              )}
              <div className="flex gap-2">
                <Button onClick={handleSaveCustomerId} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Connection
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCustomerIdForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
                  <div className="flex items-center gap-2">
                    <Badge variant={conn.isActive ? "default" : "destructive"}>
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

export default function GoogleAdsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
      <GoogleAdsContent />
    </Suspense>
  );
}
