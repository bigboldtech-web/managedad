"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Rocket } from "lucide-react";
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

interface CityCampaignDetail {
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

export default function CityCampaignDetailPage() {
  const params = useParams();
  const [cityCampaign, setCityCampaign] = useState<CityCampaignDetail | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  const id = params.id as string;

  useEffect(() => {
    async function fetchDetail() {
      try {
        const res = await fetch(`/api/city-campaigns?id=${id}`);
        if (res.ok) {
          const data = await res.json();
          // If it's an array (list endpoint), find our record
          if (Array.isArray(data)) {
            const found = data.find((c: CityCampaignDetail) => c.id === id);
            setCityCampaign(found || null);
          } else {
            setCityCampaign(data);
          }
        }
      } catch {
        // handle error
      }
      setLoading(false);
    }
    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!cityCampaign) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-xl font-semibold">City campaign not found</h2>
        <Link href="/city-campaigns">
          <Button variant="outline" className="mt-4">
            Back to City Campaigns
          </Button>
        </Link>
      </div>
    );
  }

  const config = cityCampaign.generatedConfig;
  const research = cityCampaign.researchData || config?.cityData;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/city-campaigns">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5" />
            <h1 className="text-3xl font-bold">
              {cityCampaign.cityName}
              {cityCampaign.state ? `, ${cityCampaign.state}` : ""}
            </h1>
            <Badge
              variant={
                cityCampaign.status === "ACTIVE" ? "default" : "secondary"
              }
              className={
                cityCampaign.status === "ACTIVE"
                  ? "bg-green-100 text-green-800"
                  : ""
              }
            >
              {cityCampaign.status}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {cityCampaign.businessType || "General"} campaign &middot; Created{" "}
            {new Date(cityCampaign.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Research Data */}
      {research && (
        <Card>
          <CardHeader>
            <CardTitle>City Research Data</CardTitle>
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

      {/* Generated Config */}
      {config && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Campaign Configuration</CardTitle>
              <CardDescription>{config.name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium">Geo Targeting</h3>
                <p className="mt-1 text-sm">
                  {config.geoTargeting.city}, {config.geoTargeting.state} -{" "}
                  {config.geoTargeting.radiusMiles} mile radius
                </p>
              </div>

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
                    <p className="text-sm text-muted-foreground">
                      Descriptions
                    </p>
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
            </CardContent>
          </Card>
        </>
      )}

      {/* Linked Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle>Deployed Campaigns</CardTitle>
          <CardDescription>
            Campaigns created from this city campaign configuration.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cityCampaign.campaigns.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No campaigns deployed yet from this configuration.
            </p>
          ) : (
            <div className="space-y-3">
              {cityCampaign.campaigns.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <Link
                      href={`/campaigns/${c.id}`}
                      className="font-medium hover:underline"
                    >
                      {c.name}
                    </Link>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge
                        variant={
                          c.platform === "GOOGLE_ADS" ? "default" : "secondary"
                        }
                      >
                        {c.platform === "GOOGLE_ADS" ? "Google" : "Meta"}
                      </Badge>
                      <Badge
                        variant={
                          c.status === "ACTIVE" ? "default" : "secondary"
                        }
                        className={
                          c.status === "ACTIVE"
                            ? "bg-green-100 text-green-800"
                            : ""
                        }
                      >
                        {c.status}
                      </Badge>
                    </div>
                  </div>
                  <p className="font-medium">
                    {formatCurrency(Number(c.spend))} spent
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
