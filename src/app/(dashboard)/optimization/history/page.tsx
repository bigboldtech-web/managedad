"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface OptimizationActionItem {
  id: string;
  actionType: string;
  description: string;
  status: string;
  campaign: { name: string; platform: string } | null;
  createdAt: string;
}

interface OptimizationRun {
  id: string;
  triggerType: string;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  summary: Record<string, unknown> | null;
  createdAt: string;
  actions: OptimizationActionItem[];
}

export default function OptimizationHistoryPage() {
  const [runs, setRuns] = useState<OptimizationRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRun, setExpandedRun] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch("/api/optimization/history");
        if (res.ok) setRuns(await res.json());
      } catch {
        // empty state
      }
      setLoading(false);
    }
    fetchHistory();
  }, []);

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

  const statusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
      case "APPLIED":
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "FAILED":
      case "REJECTED":
        return "bg-red-100 text-red-800";
      case "RUNNING":
        return "bg-blue-100 text-blue-800";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/optimization">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Optimization History</h1>
          <p className="text-muted-foreground">
            Past optimization runs and their actions.
          </p>
        </div>
      </div>

      {loading ? (
        <p className="py-8 text-center text-muted-foreground">Loading...</p>
      ) : runs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-semibold">No optimization runs yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Run the optimization engine from the optimization dashboard.
            </p>
            <Link href="/optimization">
              <Button className="mt-4">Go to Optimization</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {runs.map((run) => (
            <Card key={run.id}>
              <CardHeader
                className="cursor-pointer"
                onClick={() =>
                  setExpandedRun(expandedRun === run.id ? null : run.id)
                }
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {expandedRun === run.id ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <div>
                      <CardTitle className="text-base">
                        Optimization Run
                      </CardTitle>
                      <CardDescription>
                        {new Date(run.createdAt).toLocaleString()} &middot;{" "}
                        {run.triggerType} &middot; {run.actions.length} actions
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className={statusColor(run.status)}>
                    {run.status}
                  </Badge>
                </div>
              </CardHeader>
              {expandedRun === run.id && (
                <CardContent>
                  {run.actions.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      No actions generated in this run.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {run.actions.map((action) => (
                        <div
                          key={action.id}
                          className="flex items-start justify-between rounded border p-3"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                {actionTypeLabel(action.actionType)}
                              </Badge>
                              <Badge className={statusColor(action.status)}>
                                {action.status}
                              </Badge>
                              {action.campaign && (
                                <span className="text-xs text-muted-foreground">
                                  {action.campaign.name}
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {action.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
