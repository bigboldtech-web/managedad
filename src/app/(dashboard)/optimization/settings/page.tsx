"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

interface Settings {
  isEnabled: boolean;
  runFrequency: string;
  autoApply: boolean;
  minImpressions: number;
  lowPerformanceThreshold: number;
  highPerformanceThreshold: number;
  maxBudgetIncrease: number;
  maxBudgetDecrease: number;
}

const DEFAULT_SETTINGS: Settings = {
  isEnabled: true,
  runFrequency: "WEEKLY",
  autoApply: false,
  minImpressions: 100,
  lowPerformanceThreshold: 0.5,
  highPerformanceThreshold: 2.0,
  maxBudgetIncrease: 25,
  maxBudgetDecrease: 50,
};

export default function OptimizationSettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/optimization/settings");
        if (res.ok) {
          const data = await res.json();
          setSettings({
            isEnabled: data.isEnabled ?? true,
            runFrequency: data.runFrequency ?? "WEEKLY",
            autoApply: data.autoApply ?? false,
            minImpressions: data.minImpressions ?? 100,
            lowPerformanceThreshold: Number(data.lowPerformanceThreshold ?? 0.5),
            highPerformanceThreshold: Number(data.highPerformanceThreshold ?? 2.0),
            maxBudgetIncrease: Number(data.maxBudgetIncrease ?? 25),
            maxBudgetDecrease: Number(data.maxBudgetDecrease ?? 50),
          });
        }
      } catch {
        // use defaults
      }
      setLoading(false);
    }
    fetchSettings();
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/optimization/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      // handle error
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/optimization">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Optimization Settings</h1>
          <p className="text-muted-foreground">
            Configure thresholds and behavior for the optimization engine.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>
            Enable or disable the optimization engine and configure run
            frequency.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Enable Optimization</p>
              <p className="text-sm text-muted-foreground">
                Allow the engine to analyze and suggest optimizations.
              </p>
            </div>
            <button
              onClick={() =>
                setSettings({ ...settings, isEnabled: !settings.isEnabled })
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.isEnabled ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                  settings.isEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Auto-Apply</p>
              <p className="text-sm text-muted-foreground">
                Automatically apply approved actions without manual review.
              </p>
            </div>
            <button
              onClick={() =>
                setSettings({ ...settings, autoApply: !settings.autoApply })
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.autoApply ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                  settings.autoApply ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
          <div>
            <label className="text-sm font-medium">Run Frequency</label>
            <select
              value={settings.runFrequency}
              onChange={(e) =>
                setSettings({ ...settings, runFrequency: e.target.value })
              }
              className="mt-1 block w-full rounded-md border px-3 py-2 text-sm"
            >
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="BIWEEKLY">Bi-Weekly</option>
              <option value="MONTHLY">Monthly</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Thresholds</CardTitle>
          <CardDescription>
            Set minimum requirements and performance thresholds for
            optimization rules.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">
              Minimum Impressions
            </label>
            <p className="text-xs text-muted-foreground">
              Minimum impressions before an ad or keyword is evaluated.
            </p>
            <Input
              type="number"
              value={settings.minImpressions}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  minImpressions: Number(e.target.value),
                })
              }
              className="mt-1 max-w-xs"
            />
          </div>
          <Separator />
          <div>
            <label className="text-sm font-medium">
              Low Performance Threshold
            </label>
            <p className="text-xs text-muted-foreground">
              Multiplier for campaign average. Ads below this CTR ratio will be
              flagged (e.g., 0.5 = 50% of average).
            </p>
            <Input
              type="number"
              step="0.1"
              value={settings.lowPerformanceThreshold}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  lowPerformanceThreshold: Number(e.target.value),
                })
              }
              className="mt-1 max-w-xs"
            />
          </div>
          <div>
            <label className="text-sm font-medium">
              High Performance Threshold (ROAS)
            </label>
            <p className="text-xs text-muted-foreground">
              Campaigns exceeding 2x this ROAS will be considered for budget
              increase.
            </p>
            <Input
              type="number"
              step="0.1"
              value={settings.highPerformanceThreshold}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  highPerformanceThreshold: Number(e.target.value),
                })
              }
              className="mt-1 max-w-xs"
            />
          </div>
          <Separator />
          <div>
            <label className="text-sm font-medium">
              Max Budget Increase (%)
            </label>
            <p className="text-xs text-muted-foreground">
              Maximum percentage to increase daily budget in a single
              optimization.
            </p>
            <Input
              type="number"
              value={settings.maxBudgetIncrease}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  maxBudgetIncrease: Number(e.target.value),
                })
              }
              className="mt-1 max-w-xs"
            />
          </div>
          <div>
            <label className="text-sm font-medium">
              Max Budget Decrease (%)
            </label>
            <p className="text-xs text-muted-foreground">
              Maximum percentage to decrease daily budget in a single
              optimization.
            </p>
            <Input
              type="number"
              value={settings.maxBudgetDecrease}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  maxBudgetDecrease: Number(e.target.value),
                })
              }
              className="mt-1 max-w-xs"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        {saved && (
          <span className="self-center text-sm text-green-600">
            Settings saved successfully
          </span>
        )}
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Settings
        </Button>
      </div>
    </div>
  );
}
