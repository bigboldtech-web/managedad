"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, Plus, Loader2, Rocket } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatNumber } from "@/lib/utils";

interface CityData {
  name: string;
  state: string;
  population: number;
  medianIncome: number;
  competitionLevel: string;
  topIndustries: string[];
  avgCpcRange: [number, number];
}

interface GeneratedConfig {
  name: string;
  cityName: string;
  state: string;
  businessType: string;
  keywords: { text: string; matchType: string }[];
  adCopy: {
    headlines: string[];
    descriptions: string[];
  };
  geoTargeting: {
    city: string;
    state: string;
    country: string;
    radiusMiles: number;
  };
  suggestedBudget: { min: number; recommended: number; max: number };
  cityData: CityData;
}

interface CityCampaignRecord {
  id: string;
  cityName: string;
  state: string | null;
  businessType: string | null;
  status: string;
  researchData: CityData | null;
  generatedConfig: GeneratedConfig | null;
  createdAt: string;
  campaigns: {
    id: string;
    name: string;
    platform: string;
    status: string;
    spend: number;
  }[];
}

const BUSINESS_TYPES = [
  "Restaurant",
  "Plumber",
  "Dentist",
  "Lawyer",
  "Real Estate",
  "Gym",
  "Auto Repair",
  "Salon",
  "HVAC",
];

export default function CityCampaignsPage() {
  const [cityCampaigns, setCityCampaigns] = useState<CityCampaignRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [cityInput, setCityInput] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [generatedResult, setGeneratedResult] =
    useState<CityCampaignRecord | null>(null);

  useEffect(() => {
    fetchCityCampaigns();
  }, []);

  async function fetchCityCampaigns() {
    try {
      const res = await fetch("/api/city-campaigns");
      if (res.ok) setCityCampaigns(await res.json());
    } catch {
      // empty state
    }
    setLoading(false);
  }

  async function handleGenerate() {
    if (!cityInput.trim() || !businessType) return;
    setGenerating(true);
    setGeneratedResult(null);

    try {
      const res = await fetch("/api/city-campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cityName: cityInput.trim(),
          businessType: businessType.toLowerCase(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedResult(data);
        await fetchCityCampaigns();
      }
    } catch {
      // handle error
    }
    setGenerating(false);
  }

  async function handleDeploy(
    cityCampaignId: string,
    platform: "GOOGLE_ADS" | "META_ADS"
  ) {
    try {
      const result = generatedResult;
      if (!result?.generatedConfig) return;

      const config = result.generatedConfig;
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          name: config.name,
          objective: platform === "GOOGLE_ADS" ? "SEARCH" : "OUTCOME_LEADS",
          dailyBudget: config.suggestedBudget.recommended,
          targetLocations: [
            `${config.geoTargeting.city}, ${config.geoTargeting.state}`,
          ],
        }),
      });

      if (res.ok) {
        await fetchCityCampaigns();
      }
    } catch {
      // handle error
    }
  }

  const config = generatedResult?.generatedConfig;
  const research = generatedResult?.researchData || config?.cityData;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">City Campaign Builder</h1>
        <p className="text-muted-foreground">
          Generate geo-targeted campaigns for specific US cities.
        </p>
      </div>

      {/* Generator Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Generate Campaign
          </CardTitle>
          <CardDescription>
            Enter a city name and business type to generate a campaign
            configuration.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium">City Name</label>
              <Input
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                placeholder="e.g., Austin, Denver, Miami"
                className="mt-1"
              />
            </div>
            <div className="w-48">
              <label className="text-sm font-medium">Business Type</label>
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="mt-1 block w-full rounded-md border px-3 py-2 text-sm"
              >
                <option value="">Select type...</option>
                {BUSINESS_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <Button
              onClick={handleGenerate}
              disabled={generating || !cityInput.trim() || !businessType}
              className="gap-2"
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Rocket className="h-4 w-4" />
              )}
              Generate
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Research Data */}
      {research && (
        <Card>
          <CardHeader>
            <CardTitle>
              City Research: {research.name}, {research.state}
            </CardTitle>
            <CardDescription>
              Market data for campaign planning
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">Population</p>
                <p className="text-lg font-semibold">
                  {formatNumber(research.population)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Median Income</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(research.medianIncome)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Competition</p>
                <Badge
                  variant={
                    research.competitionLevel === "HIGH"
                      ? "destructive"
                      : research.competitionLevel === "MEDIUM"
                        ? "default"
                        : "secondary"
                  }
                >
                  {research.competitionLevel}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg CPC Range</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(research.avgCpcRange[0])} -{" "}
                  {formatCurrency(research.avgCpcRange[1])}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">Top Industries</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {research.topIndustries.map((industry) => (
                  <Badge key={industry} variant="outline">
                    {industry}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generated Campaign Config */}
      {config && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Campaign: {config.name}</CardTitle>
            <CardDescription>
              Review and deploy this campaign configuration.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Budget */}
            <div>
              <h3 className="font-medium">Suggested Budget</h3>
              <div className="mt-2 flex gap-4">
                <div className="rounded border p-3 text-center">
                  <p className="text-xs text-muted-foreground">Min</p>
                  <p className="font-semibold">
                    {formatCurrency(config.suggestedBudget.min)}/day
                  </p>
                </div>
                <div className="rounded border-2 border-primary bg-primary/5 p-3 text-center">
                  <p className="text-xs text-muted-foreground">Recommended</p>
                  <p className="text-lg font-bold">
                    {formatCurrency(config.suggestedBudget.recommended)}/day
                  </p>
                </div>
                <div className="rounded border p-3 text-center">
                  <p className="text-xs text-muted-foreground">Max</p>
                  <p className="font-semibold">
                    {formatCurrency(config.suggestedBudget.max)}/day
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Keywords */}
            <div>
              <h3 className="font-medium">
                Keywords ({config.keywords.length})
              </h3>
              <div className="mt-2 max-h-48 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-2 font-medium text-muted-foreground">
                        Keyword
                      </th>
                      <th className="pb-2 font-medium text-muted-foreground">
                        Match Type
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {config.keywords.map((kw, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-1.5">{kw.text}</td>
                        <td className="py-1.5">
                          <Badge variant="outline">{kw.matchType}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <Separator />

            {/* Ad Copy */}
            <div>
              <h3 className="font-medium">Ad Copy</h3>
              <div className="mt-2 space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Headlines</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {config.adCopy.headlines.map((h, i) => (
                      <Badge key={i} variant="secondary">
                        {h}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Descriptions</p>
                  <div className="mt-1 space-y-1">
                    {config.adCopy.descriptions.map((d, i) => (
                      <p key={i} className="text-sm">
                        {d}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Geo Targeting */}
            <div>
              <h3 className="font-medium">Geo Targeting</h3>
              <p className="mt-1 text-sm">
                {config.geoTargeting.city}, {config.geoTargeting.state} -
                {config.geoTargeting.radiusMiles} mile radius
              </p>
            </div>

            <Separator />

            {/* Deploy Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={() => handleDeploy(generatedResult!.id, "GOOGLE_ADS")}
                className="gap-2"
              >
                <Rocket className="h-4 w-4" />
                Deploy to Google Ads
              </Button>
              <Button
                variant="outline"
                onClick={() => handleDeploy(generatedResult!.id, "META_ADS")}
                className="gap-2"
              >
                <Rocket className="h-4 w-4" />
                Deploy to Meta Ads
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing City Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle>City Campaigns</CardTitle>
          <CardDescription>
            Previously generated city campaign configurations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-8 text-center text-muted-foreground">
              Loading...
            </p>
          ) : cityCampaigns.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No city campaigns yet. Generate one above.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium text-muted-foreground">
                      City
                    </th>
                    <th className="pb-3 font-medium text-muted-foreground">
                      Business Type
                    </th>
                    <th className="pb-3 font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="pb-3 font-medium text-muted-foreground">
                      Campaigns
                    </th>
                    <th className="pb-3 font-medium text-muted-foreground">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {cityCampaigns.map((cc) => (
                    <tr key={cc.id} className="border-b last:border-0">
                      <td className="py-3">
                        <Link
                          href={`/city-campaigns/${cc.id}`}
                          className="font-medium hover:underline"
                        >
                          {cc.cityName}
                          {cc.state ? `, ${cc.state}` : ""}
                        </Link>
                      </td>
                      <td className="py-3">{cc.businessType || "-"}</td>
                      <td className="py-3">
                        <Badge
                          variant={
                            cc.status === "ACTIVE" ? "default" : "secondary"
                          }
                          className={
                            cc.status === "ACTIVE"
                              ? "bg-green-100 text-green-800"
                              : ""
                          }
                        >
                          {cc.status}
                        </Badge>
                      </td>
                      <td className="py-3">{cc.campaigns.length}</td>
                      <td className="py-3 text-muted-foreground">
                        {new Date(cc.createdAt).toLocaleDateString()}
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
