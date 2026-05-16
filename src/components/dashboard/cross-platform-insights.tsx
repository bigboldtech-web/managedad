"use client";

import { useEffect, useState } from "react";
import { GitMerge } from "lucide-react";

interface Insight {
  id: string;
  sourcePlatform: "GOOGLE_ADS" | "META_ADS";
  targetPlatform: "GOOGLE_ADS" | "META_ADS";
  insightType: string;
  pattern: { ngram?: string; weightedCtr?: number };
  confidence: string;
  appearsInCount: number;
}

const PLATFORM_LABELS: Record<string, string> = {
  GOOGLE_ADS: "Google",
  META_ADS: "Meta",
};

export default function CrossPlatformInsights() {
  const [insights, setInsights] = useState<Insight[] | null>(null);

  useEffect(() => {
    fetch("/api/cross-platform-insights")
      .then((r) => (r.ok ? r.json() : { insights: [] }))
      .then((d) => setInsights(d.insights ?? []));
  }, []);

  if (!insights || insights.length === 0) return null;

  return (
    <div
      style={{
        background: "#111114",
        border: "1px solid #27272e",
        borderRadius: 12,
        padding: 20,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <GitMerge size={16} color="#8b5cf6" />
        <strong style={{ color: "#fafafa", fontSize: 14 }}>Cross-platform winners</strong>
      </div>
      <p style={{ color: "#71717a", fontSize: 12, marginBottom: 16, lineHeight: 1.5 }}>
        Phrases that drive clicks on one platform — worth trying on the other.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {insights.slice(0, 5).map((ins) => (
          <div
            key={ins.id}
            style={{
              background: "#0e0e10",
              borderRadius: 8,
              padding: 12,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: "#e4e4e7", marginBottom: 2 }}>
                &ldquo;{ins.pattern.ngram}&rdquo;
              </div>
              <div style={{ fontSize: 11, color: "#71717a" }}>
                Winning on {PLATFORM_LABELS[ins.sourcePlatform]} ·{" "}
                {ins.appearsInCount} top ad{ins.appearsInCount === 1 ? "" : "s"} · try on{" "}
                {PLATFORM_LABELS[ins.targetPlatform]}
              </div>
            </div>
            <span
              style={{
                fontSize: 11,
                color: "#a78bfa",
                background: "rgba(139,92,246,0.1)",
                padding: "2px 8px",
                borderRadius: 4,
                whiteSpace: "nowrap",
              }}
            >
              {(Number(ins.confidence) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
