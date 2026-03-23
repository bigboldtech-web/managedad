"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Zap,
  Play,
  Check,
  X,
  Clock,
  Settings,
  History,
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
import { Separator } from "@/components/ui/separator";

interface OptimizationActionItem {
  id: string;
  actionType: string;
  description: string;
  status: string;
  previousValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  campaign: { name: string; platform: string } | null;
  createdAt: string;
}

interface OptimizationRun {
  id: string;
  status: string;
  summary: Record<string, unknown> | null;
  createdAt: string;
  actions: OptimizationActionItem[];
}

export default function OptimizationPage() {
  const [runs, setRuns] = useState<OptimizationRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [autoApply, setAutoApply] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [historyRes, settingsRes] = await Promise.all([
        fetch("/api/optimization/history"),
        fetch("/api/optimization/settings"),
      ]);
      if (historyRes.ok) setRuns(await historyRes.json());
      if (settingsRes.ok) {
        const settings = await settingsRes.json();
        setAutoApply(settings.autoApply);
      }
    } catch {
      // empty state
    }
    setLoading(false);
  }

  async function handleRunOptimization() {
    setRunning(true);
    try {
      const res = await fetch("/api/optimization/run", { method: "POST" });
      if (res.ok) {
        await fetchData();
      }
    } catch {
      // handle error
    }
    setRunning(false);
  }

  async function handleToggleAutoApply() {
    const newValue = !autoApply;
    setAutoApply(newValue);
    await fetch("/api/optimization/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ autoApply: newValue }),
    });
  }

  async function handleActionUpdate(actionId: string, status: "APPROVED" | "REJECTED") {
    try {
      // Update action status via a PATCH to the run
      // For now, use a direct approach
      const res = await fetch("/api/optimization/history", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionId, status }),
      });
      if (res.ok) {
        setRuns((prev) =>
          prev.map((run) => ({
            ...run,
            actions: run.actions.map((a) =>
              a.id === actionId ? { ...a, status } : a
            ),
          }))
        );
      }
    } catch {
      // handle error
    }
  }

  // Collect all pending actions from all runs
  const pendingActions = runs.flatMap((run) =>
    run.actions
      .filter((a) => a.status === "PENDING")
      .map((a) => ({ ...a, runId: run.id }))
  );

  const appliedCount = runs.flatMap((r) => r.actions).filter((a) => a.status === "APPLIED" || a.status === "APPROVED").length;
  const rejectedCount = runs.flatMap((r) => r.actions).filter((a) => a.status === "REJECTED").length;

  const actionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      INCREASE_BUDGET: "Increase Budget",
      DECREASE_BUDGET: "Decrease Budget",
      PAUSE_AD: "Pause Ad",
      ENABLE_AD: "Enable Ad",
      PAUSE_KEYWORD: "Pause Keyword",
      ADD_NEGATIVE_KEYWORD: "Add Negative Keyword",
      ADJUST_BID: "Adjust Bid",
      CREATE_AD_VARIATION: "Create Variation",
      SUGGEST_AB_TEST: "A/B Test",
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Optimization</h1>
          <p className="text-muted-foreground">
            AI-powered suggestions to improve your campaign performance.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/optimization/history">
            <Button variant="outline" className="gap-2">
              <History className="h-4 w-4" />
              History
            </Button>
          </Link>
          <Link href="/optimization/settings">
            <Button variant="outline" className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </Link>
          <Button
            onClick={handleRunOptimization}
            disabled={running}
            className="gap-2"
          >
            {running ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
            Run Optimization
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingActions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Applied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {appliedCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rejected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {rejectedCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Auto-Apply
            </CardTitle>
          </CardHeader>
          <CardContent>
            <button
              onClick={handleToggleAutoApply}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                autoApply ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                  autoApply ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Pending Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pending Actions
          </CardTitle>
          <CardDescription>
            Review and approve or reject optimization suggestions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-8 text-center text-muted-foreground">
              Loading...
            </p>
          ) : pendingActions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Zap className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-semibold">No pending actions</h3>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Run the optimization engine to generate new suggestions for
                improving your campaigns.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingActions.map((action) => (
                <div
                  key={action.id}
                  className="flex items-start justify-between rounded-lg border p-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {actionTypeLabel(action.actionType)}
                      </Badge>
                      {action.campaign && (
                        <Badge
                          variant={
                            action.campaign.platform === "GOOGLE_ADS"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {action.campaign.platform === "GOOGLE_ADS"
                            ? "Google"
                            : "Meta"}
                        </Badge>
                      )}
                      {action.campaign && (
                        <span className="text-sm text-muted-foreground">
                          {action.campaign.name}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm">{action.description}</p>
                  </div>
                  <div className="ml-4 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-green-600 hover:bg-green-50 hover:text-green-700"
                      onClick={() => handleActionUpdate(action.id, "APPROVED")}
                    >
                      <Check className="h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => handleActionUpdate(action.id, "REJECTED")}
                    >
                      <X className="h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
