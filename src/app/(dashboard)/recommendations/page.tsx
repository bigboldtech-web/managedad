"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp, Loader2, Megaphone, Users, DollarSign, Target, Image, Shield, Zap,
  ArrowUp, ArrowDown, ChevronDown, ChevronUp,
} from "lucide-react";

const S = {
  card: { background: "#111114", border: "1px solid #27272e", borderRadius: "12px" } as React.CSSProperties,
};

const CATEGORY_META: Record<string, { icon: any; color: string }> = {
  NEW_CAMPAIGN: { icon: Megaphone, color: "#f97316" },
  AUDIENCE_EXPANSION: { icon: Users, color: "#818cf8" },
  BUDGET_SCALING: { icon: DollarSign, color: "#34d399" },
  TARGETING: { icon: Target, color: "#fbbf24" },
  CREATIVE_REFRESH: { icon: Image, color: "#fb923c" },
  COMPETITOR_DEFENSE: { icon: Shield, color: "#f87171" },
  OPTIMIZATION: { icon: Zap, color: "#a78bfa" },
};

interface Recommendation {
  category: string;
  title: string;
  description: string;
  impact: string;
  effort: string;
  steps: string[];
}

interface GrowthData {
  latest: {
    id: string;
    weekStart: string;
    recommendations: Recommendation[];
    summary: string;
  } | null;
  history: { id: string; weekStart: string; summary: string; createdAt: string }[];
}

export default function RecommendationsPage() {
  const [data, setData] = useState<GrowthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(0);

  useEffect(() => {
    fetch("/api/recommendations")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <Loader2 size={24} color="#f97316" style={{ animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const recs = data?.latest?.recommendations || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h1 style={{ fontFamily: '"Sora", sans-serif', fontSize: "22px", fontWeight: 800, color: "#fafafa", letterSpacing: "-0.5px", marginBottom: "3px" }}>
          Growth Recommendations
        </h1>
        <p style={{ fontSize: "13px", color: "#52525b" }}>
          AI-generated growth strategies based on your actual campaign performance data. Updated weekly.
        </p>
      </div>

      {/* Summary card */}
      {data?.latest && (
        <div style={{ ...S.card, padding: "20px 24px", borderColor: "rgba(249,115,22,0.2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <TrendingUp size={18} color="#f97316" />
            <span style={{ fontSize: "14px", fontWeight: 700, color: "#fafafa" }}>This Week&apos;s Strategy</span>
            <span style={{ fontSize: "10px", color: "#52525b", marginLeft: "auto" }}>
              Week of {new Date(data.latest.weekStart).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </div>
          <p style={{ fontSize: "13px", color: "#a1a1aa", lineHeight: "1.7", margin: 0 }}>
            {data.latest.summary}
          </p>
        </div>
      )}

      {/* Recommendations */}
      {recs.length === 0 ? (
        <div style={{ ...S.card, padding: "40px", textAlign: "center" }}>
          <TrendingUp size={32} color="#3f3f46" style={{ margin: "0 auto 12px" }} />
          <div style={{ fontSize: "15px", fontWeight: 600, color: "#52525b", marginBottom: "4px" }}>
            No recommendations yet
          </div>
          <div style={{ fontSize: "12px", color: "#3f3f46" }}>
            Growth recommendations are generated every Monday based on your campaign data. Enable autonomous mode to get started.
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {recs.map((rec, idx) => {
            const meta = CATEGORY_META[rec.category] || { icon: Zap, color: "#52525b" };
            const Icon = meta.icon;
            const isExpanded = expandedIdx === idx;
            const impactColor = rec.impact === "HIGH" ? "#34d399" : rec.impact === "MEDIUM" ? "#fbbf24" : "#52525b";

            return (
              <div key={idx} style={{ ...S.card, overflow: "hidden" }}>
                <button
                  onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                  style={{
                    width: "100%", padding: "16px 20px", display: "flex", alignItems: "center", gap: "14px",
                    background: "transparent", border: "none", cursor: "pointer", textAlign: "left",
                  }}
                >
                  <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: `${meta.color}10`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={18} color={meta.color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#fafafa", marginBottom: "2px" }}>
                      {rec.title}
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <span style={{ fontSize: "10px", padding: "1px 6px", borderRadius: "3px", background: `${impactColor}15`, color: impactColor, fontWeight: 600 }}>
                        {rec.impact === "HIGH" ? <><ArrowUp size={9} /> High Impact</> : rec.impact} Impact
                      </span>
                      <span style={{ fontSize: "10px", padding: "1px 6px", borderRadius: "3px", background: "rgba(113,113,122,0.1)", color: "#71717a" }}>
                        {rec.effort} Effort
                      </span>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp size={16} color="#52525b" /> : <ChevronDown size={16} color="#52525b" />}
                </button>

                {isExpanded && (
                  <div style={{ padding: "0 20px 20px", borderTop: "1px solid #1f1f25" }}>
                    <p style={{ fontSize: "13px", color: "#a1a1aa", lineHeight: "1.7", margin: "14px 0" }}>
                      {rec.description}
                    </p>
                    {rec.steps?.length > 0 && (
                      <div>
                        <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#3f3f46", marginBottom: "8px" }}>
                          ACTION STEPS
                        </div>
                        {rec.steps.map((step, si) => (
                          <div key={si} style={{ display: "flex", gap: "10px", marginBottom: "6px" }}>
                            <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "rgba(249,115,22,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "10px", fontWeight: 700, color: "#f97316" }}>
                              {si + 1}
                            </div>
                            <span style={{ fontSize: "12px", color: "#a1a1aa", lineHeight: "20px" }}>{step}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
