"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber } from "@/lib/utils";

interface Keyword {
  id: string;
  text: string;
  matchType: string;
  isNegative: boolean;
  status: string;
  maxCpcBid: number | null;
  qualityScore: number | null;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  campaign: { name: string };
  adGroup: { name: string } | null;
}

export default function KeywordsPage() {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMatchType, setFilterMatchType] = useState<string>("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newKeyword, setNewKeyword] = useState("");
  const [newMatchType, setNewMatchType] = useState("EXACT");
  const [newIsNegative, setNewIsNegative] = useState(false);

  useEffect(() => {
    fetchKeywords();
  }, [filterMatchType]);

  async function fetchKeywords() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterMatchType) params.set("matchType", filterMatchType);
      const res = await fetch(`/api/google-ads/keywords?${params}`);
      if (res.ok) setKeywords(await res.json());
    } catch {
      // empty
    }
    setLoading(false);
  }

  async function removeKeyword(id: string) {
    const res = await fetch(`/api/google-ads/keywords?id=${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setKeywords(keywords.filter((k) => k.id !== id));
    }
  }

  const filteredKeywords = keywords.filter((k) =>
    k.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const matchTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      EXACT: "bg-blue-100 text-blue-800",
      PHRASE: "bg-purple-100 text-purple-800",
      BROAD: "bg-orange-100 text-orange-800",
    };
    return colors[type] || "";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Keyword Manager</h1>
          <p className="text-muted-foreground">
            Manage keywords across all your Google Ads campaigns.
          </p>
        </div>
        <Button
          className="gap-2"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <Plus className="h-4 w-4" />
          Add Keywords
        </Button>
      </div>

      {/* Add Keywords Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add Keywords</CardTitle>
            <CardDescription>
              Add new keywords to your campaigns. One keyword per line.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Keywords (one per line)
                </label>
                <textarea
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                  rows={4}
                  placeholder="Enter keywords, one per line..."
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                />
              </div>
              <div className="flex gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Match Type
                  </label>
                  <select
                    className="rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                    value={newMatchType}
                    onChange={(e) => setNewMatchType(e.target.value)}
                  >
                    <option value="EXACT">Exact Match</option>
                    <option value="PHRASE">Phrase Match</option>
                    <option value="BROAD">Broad Match</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={newIsNegative}
                      onChange={(e) => setNewIsNegative(e.target.checked)}
                    />
                    Negative Keyword
                  </label>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setShowAddForm(false)} variant="outline">
                  Cancel
                </Button>
                <Button>Add Keywords</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search keywords..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="rounded-md border border-input bg-transparent px-3 py-2 text-sm"
          value={filterMatchType}
          onChange={(e) => setFilterMatchType(e.target.value)}
        >
          <option value="">All Match Types</option>
          <option value="EXACT">Exact</option>
          <option value="PHRASE">Phrase</option>
          <option value="BROAD">Broad</option>
        </select>
      </div>

      {/* Keywords Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <p className="py-8 text-center text-muted-foreground">Loading keywords...</p>
          ) : filteredKeywords.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No keywords found. Add keywords to your campaigns to get started.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium text-muted-foreground">Keyword</th>
                    <th className="pb-3 font-medium text-muted-foreground">Match Type</th>
                    <th className="pb-3 font-medium text-muted-foreground">Campaign</th>
                    <th className="pb-3 font-medium text-muted-foreground">Status</th>
                    <th className="pb-3 text-right font-medium text-muted-foreground">QS</th>
                    <th className="pb-3 text-right font-medium text-muted-foreground">Impressions</th>
                    <th className="pb-3 text-right font-medium text-muted-foreground">Clicks</th>
                    <th className="pb-3 text-right font-medium text-muted-foreground">Conv.</th>
                    <th className="pb-3 text-right font-medium text-muted-foreground">Spend</th>
                    <th className="pb-3 font-medium text-muted-foreground"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredKeywords.map((keyword) => (
                    <tr key={keyword.id} className="border-b last:border-0">
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          {keyword.isNegative && (
                            <Badge variant="destructive" className="text-xs">
                              NEG
                            </Badge>
                          )}
                          <span className="font-medium">{keyword.text}</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <Badge className={matchTypeBadge(keyword.matchType)}>
                          {keyword.matchType}
                        </Badge>
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {keyword.campaign.name}
                      </td>
                      <td className="py-3">
                        <Badge
                          variant={keyword.status === "ACTIVE" ? "default" : "secondary"}
                          className={keyword.status === "ACTIVE" ? "bg-green-100 text-green-800" : ""}
                        >
                          {keyword.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-right">
                        {keyword.qualityScore ?? "—"}
                      </td>
                      <td className="py-3 text-right">
                        {formatNumber(keyword.impressions)}
                      </td>
                      <td className="py-3 text-right">
                        {formatNumber(keyword.clicks)}
                      </td>
                      <td className="py-3 text-right">
                        {keyword.conversions}
                      </td>
                      <td className="py-3 text-right">
                        {formatCurrency(keyword.spend)}
                      </td>
                      <td className="py-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeKeyword(keyword.id)}
                          title="Remove keyword"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
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
