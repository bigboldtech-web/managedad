"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Zap,
  Crown,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatNumber } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────

interface PlatformPerformance {
  platform: "GOOGLE_ADS" | "META_ADS";
  totalSpend: number;
  totalRevenue: number;
  totalConversions: number;
  roas: number;
  cpa: number;
  activeCampaigns: number;
}

interface ReallocationRecommendation {
  fromPlatform: "GOOGLE_ADS" | "META_ADS";
  toPlatform: "GOOGLE_ADS" | "META_ADS";
  fromCampaignId: string;
  toCampaignId: string;
  amount: number;
  reason: string;
  fromCurrentBudget: number;
  toCurrentBudget: number;
  fromNewBudget: number;
  toNewBudget: number;
  projectedRoasImprovement: number;
}

interface Analysis {
  platforms: PlatformPerformance[];
  recommendations: ReallocationRecommendation[];
  isEligible: boolean;
  reason?: string;
}

// ─── Inline Styles ───────────────────────────────────────────

const S = {
  card: {
    background: "#111114",
    border: "1px solid #27272e",
    borderRadius: "12px",
  } as React.CSSProperties,
  mono: {
    fontFamily: "var(--font-ibm-plex-mono), monospace",
  } as React.CSSProperties,
};

const PLATFORM_LABEL: Record<string, string> = {
  GOOGLE_ADS: "Google Ads",
  META_ADS: "Meta Ads",
};

const PLATFORM_COLOR: Record<string, string> = {
  GOOGLE_ADS: "#f97316",
  META_ADS: "#34d399",
};

// ─── Demo Data ───────────────────────────────────────────────

function getDemoAnalysis(): Analysis {
  return {
    platforms: [
      {
        platform: "GOOGLE_ADS",
        totalSpend: 145000,
        totalRevenue: 580000,
        totalConversions: 284,
        roas: 4.0,
        cpa: 510.56,
        activeCampaigns: 3,
      },
      {
        platform: "META_ADS",
        totalSpend: 103500,
        totalRevenue: 652050,
        totalConversions: 322,
        roas: 6.3,
        cpa: 321.43,
        activeCampaigns: 2,
      },
    ],
    recommendations: [
      {
        fromPlatform: "GOOGLE_ADS",
        toPlatform: "META_ADS",
        fromCampaignId: "demo-1",
        toCampaignId: "demo-2",
        amount: 2100,
        reason:
          'Meta Ads ROAS (6.30x) is 58% higher than Google Ads (4.00x). Shift \u20b92,100/day from "Brand Awareness \u2014 India" to "Retargeting \u2014 Website Visitors".',
        fromCurrentBudget: 14000,
        toCurrentBudget: 18000,
        fromNewBudget: 11900,
        toNewBudget: 20100,
        projectedRoasImprovement: 8.7,
      },
      {
        fromPlatform: "GOOGLE_ADS",
        toPlatform: "META_ADS",
        fromCampaignId: "demo-3",
        toCampaignId: "demo-2",
        amount: 1500,
        reason:
          'Meta Ads ROAS (6.30x) is 58% higher than Google Ads (4.00x). Shift \u20b91,500/day from "Product Launch Q2" to "Retargeting \u2014 Website Visitors".',
        fromCurrentBudget: 10000,
        toCurrentBudget: 18000,
        fromNewBudget: 8500,
        toNewBudget: 19500,
        projectedRoasImprovement: 8.7,
      },
    ],
    isEligible: true,
  };
}

// ─── Component ───────────────────────────────────────────────

export default function ReallocationPage() {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [applyingIndex, setApplyingIndex] = useState<number | null>(null);
  const [appliedIndices, setAppliedIndices] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalysis() {
      try {
        const res = await fetch("/api/optimization/reallocation");
        if (res.ok) {
          setAnalysis(await res.json());
          setLoading(false);
          return;
        }
      } catch {}
      // Fallback to demo data
      setAnalysis(getDemoAnalysis());
      setLoading(false);
    }
    fetchAnalysis();
    const t = setTimeout(() => {
      setAnalysis((a) => a ?? getDemoAnalysis());
      setLoading(false);
    }, 1500);
    return () => clearTimeout(t);
  }, []);

  async function handleApply(index: number) {
    setApplyingIndex(index);
    setError(null);
    try {
      const res = await fetch("/api/optimization/reallocation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recommendationIndex: index }),
      });
      if (res.ok) {
        setAppliedIndices((prev) => new Set(prev).add(index));
      } else {
        const data = await res.json();
        setError(data.error || "Failed to apply reallocation");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setApplyingIndex(null);
    }
  }

  // ─── Loading ─────────────────────────────────────────────

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "calc(100vh - 120px)",
        }}
      >
        <div
          style={{
            width: "24px",
            height: "24px",
            border: "2px solid #27272e",
            borderTopColor: "#f97316",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ─── Not Eligible (upgrade prompt) ───────────────────────

  if (analysis && !analysis.isEligible) {
    return (
      <div style={{ maxWidth: "640px", margin: "80px auto", textAlign: "center" }}>
        <div
          style={{
            ...S.card,
            padding: "48px 32px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "20px",
          }}
        >
          <Crown size={48} color="#f97316" />
          <h2
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: "#fafafa",
              margin: 0,
            }}
          >
            Agency Plan Required
          </h2>
          <p style={{ color: "#a1a1aa", fontSize: "15px", lineHeight: 1.6, maxWidth: "440px" }}>
            Cross-platform budget reallocation automatically shifts spend between
            Google Ads and Meta Ads based on real-time performance. This
            feature is exclusive to the Agency plan.
          </p>
          <Link
            href="/billing"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 28px",
              background: "#f97316",
              color: "#fff",
              borderRadius: "8px",
              fontWeight: 600,
              fontSize: "14px",
              textDecoration: "none",
              marginTop: "8px",
            }}
          >
            Upgrade to Agency
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  const google = analysis?.platforms.find((p) => p.platform === "GOOGLE_ADS");
  const meta = analysis?.platforms.find((p) => p.platform === "META_ADS");
  const recommendations = analysis?.recommendations || [];

  // Determine which platform is the winner
  const betterPlatform =
    (google?.roas ?? 0) >= (meta?.roas ?? 0) ? "GOOGLE_ADS" : "META_ADS";

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "14px",
          marginBottom: "32px",
          flexWrap: "wrap",
        }}
      >
        <h1
          style={{
            fontSize: "24px",
            fontWeight: 700,
            color: "#fafafa",
            margin: 0,
          }}
        >
          Cross-Platform Reallocation
        </h1>
        <span
          style={{
            padding: "4px 12px",
            background: "rgba(249, 115, 22, 0.15)",
            color: "#f97316",
            borderRadius: "6px",
            fontSize: "12px",
            fontWeight: 600,
            letterSpacing: "0.5px",
          }}
        >
          AGENCY
        </span>
      </div>

      {/* Platform Comparison Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px",
          marginBottom: "32px",
        }}
      >
        {[google, meta].map((platform) => {
          if (!platform) return null;
          const isWinner = platform.platform === betterPlatform;
          const color = PLATFORM_COLOR[platform.platform];
          return (
            <div
              key={platform.platform}
              style={{
                ...S.card,
                padding: "24px",
                borderColor: isWinner ? color : "#27272e",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {isWinner && (
                <div
                  style={{
                    position: "absolute",
                    top: "12px",
                    right: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    background: "rgba(34, 197, 94, 0.12)",
                    color: "#22c55e",
                    padding: "3px 10px",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: 600,
                  }}
                >
                  <TrendingUp size={12} />
                  BETTER
                </div>
              )}
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color,
                  marginBottom: "20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: color,
                  }}
                />
                {PLATFORM_LABEL[platform.platform]}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                }}
              >
                <MetricCell
                  label="ROAS"
                  value={`${platform.roas.toFixed(2)}x`}
                  highlight={isWinner}
                />
                <MetricCell
                  label="CPA"
                  value={formatCurrency(platform.cpa)}
                  highlight={!isWinner && platform.cpa > 0}
                  negative
                />
                <MetricCell
                  label="Spend (14d)"
                  value={formatCurrency(platform.totalSpend)}
                />
                <MetricCell
                  label="Conversions"
                  value={formatNumber(platform.totalConversions)}
                />
                <MetricCell
                  label="Revenue"
                  value={formatCurrency(platform.totalRevenue)}
                />
                <MetricCell
                  label="Campaigns"
                  value={String(platform.activeCampaigns)}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Budget Flow Diagram */}
      {recommendations.length > 0 && (
        <div
          style={{
            ...S.card,
            padding: "28px 32px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "#a1a1aa",
              marginBottom: "20px",
              letterSpacing: "0.5px",
              textTransform: "uppercase",
            }}
          >
            Proposed Budget Flow
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "24px",
              padding: "20px 0",
            }}
          >
            {/* From Platform */}
            <PlatformBox
              platform={recommendations[0].fromPlatform}
              label="Reduce"
              totalAmount={recommendations.reduce((s, r) => s + r.amount, 0)}
              direction="out"
            />

            {/* Arrow */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <div
                style={{
                  ...S.mono,
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "#f97316",
                }}
              >
                {formatCurrency(
                  recommendations.reduce((s, r) => s + r.amount, 0)
                )}
                /day
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <div
                  style={{
                    width: "60px",
                    height: "2px",
                    background:
                      "linear-gradient(90deg, #f97316 0%, #f9731680 100%)",
                  }}
                />
                <ArrowRight size={20} color="#f97316" />
                <div
                  style={{
                    width: "60px",
                    height: "2px",
                    background:
                      "linear-gradient(90deg, #f9731680 0%, #f97316 100%)",
                  }}
                />
              </div>
              <div style={{ fontSize: "11px", color: "#71717a" }}>
                Daily reallocation
              </div>
            </div>

            {/* To Platform */}
            <PlatformBox
              platform={recommendations[0].toPlatform}
              label="Boost"
              totalAmount={recommendations.reduce((s, r) => s + r.amount, 0)}
              direction="in"
            />
          </div>
        </div>
      )}

      {/* Status / Reason Message */}
      {analysis?.reason && recommendations.length === 0 && (
        <div
          style={{
            ...S.card,
            padding: "20px 24px",
            marginBottom: "32px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            borderColor: "#3f3f46",
          }}
        >
          <AlertTriangle size={18} color="#eab308" />
          <span style={{ color: "#a1a1aa", fontSize: "14px" }}>
            {analysis.reason}
          </span>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div
          style={{
            ...S.card,
            padding: "16px 20px",
            marginBottom: "20px",
            borderColor: "#dc2626",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <AlertTriangle size={16} color="#dc2626" />
          <span style={{ color: "#fca5a5", fontSize: "13px" }}>{error}</span>
        </div>
      )}

      {/* Recommendations List */}
      {recommendations.length > 0 && (
        <div>
          <div
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "#a1a1aa",
              marginBottom: "16px",
              letterSpacing: "0.5px",
              textTransform: "uppercase",
            }}
          >
            Recommendations
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {recommendations.map((rec, i) => {
              const isApplied = appliedIndices.has(i);
              const isApplying = applyingIndex === i;
              return (
                <div
                  key={i}
                  style={{
                    ...S.card,
                    padding: "20px 24px",
                    opacity: isApplied ? 0.6 : 1,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "16px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: "280px" }}>
                      <p
                        style={{
                          color: "#d4d4d8",
                          fontSize: "14px",
                          lineHeight: 1.6,
                          margin: "0 0 14px",
                        }}
                      >
                        {rec.reason}
                      </p>
                      <div
                        style={{
                          display: "flex",
                          gap: "24px",
                          flexWrap: "wrap",
                        }}
                      >
                        <BudgetChange
                          label="From Budget"
                          current={rec.fromCurrentBudget}
                          updated={rec.fromNewBudget}
                          direction="decrease"
                        />
                        <BudgetChange
                          label="To Budget"
                          current={rec.toCurrentBudget}
                          updated={rec.toNewBudget}
                          direction="increase"
                        />
                        <div>
                          <div
                            style={{
                              fontSize: "11px",
                              color: "#71717a",
                              marginBottom: "4px",
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                            }}
                          >
                            Projected ROAS Lift
                          </div>
                          <div
                            style={{
                              ...S.mono,
                              fontSize: "16px",
                              fontWeight: 600,
                              color: "#22c55e",
                            }}
                          >
                            +{rec.projectedRoasImprovement}%
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleApply(i)}
                      disabled={isApplied || isApplying}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "10px 22px",
                        background: isApplied
                          ? "#22c55e20"
                          : isApplying
                            ? "#f9731660"
                            : "#f97316",
                        color: isApplied ? "#22c55e" : "#fff",
                        border: "none",
                        borderRadius: "8px",
                        fontWeight: 600,
                        fontSize: "13px",
                        cursor:
                          isApplied || isApplying ? "default" : "pointer",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                        marginTop: "4px",
                      }}
                    >
                      {isApplied ? (
                        <>
                          <CheckCircle2 size={15} />
                          Applied
                        </>
                      ) : isApplying ? (
                        <>
                          <Loader2
                            size={15}
                            style={{ animation: "spin 0.8s linear infinite" }}
                          />
                          Applying...
                        </>
                      ) : (
                        <>
                          <Zap size={15} />
                          Apply
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────

function MetricCell({
  label,
  value,
  highlight,
  negative,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  negative?: boolean;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: "11px",
          color: "#71717a",
          marginBottom: "4px",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--font-ibm-plex-mono), monospace",
          fontSize: "18px",
          fontWeight: 600,
          color: highlight
            ? negative
              ? "#f87171"
              : "#22c55e"
            : "#fafafa",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function PlatformBox({
  platform,
  label,
  totalAmount,
  direction,
}: {
  platform: string;
  label: string;
  totalAmount: number;
  direction: "in" | "out";
}) {
  const color = PLATFORM_COLOR[platform];
  const borderColor =
    direction === "in" ? "#22c55e" : "#ef4444";
  return (
    <div
      style={{
        background: "#111114",
        border: `2px solid ${borderColor}40`,
        borderRadius: "12px",
        padding: "20px 28px",
        textAlign: "center",
        minWidth: "160px",
      }}
    >
      <div
        style={{
          fontSize: "13px",
          fontWeight: 600,
          color,
          marginBottom: "6px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
        }}
      >
        <div
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: color,
          }}
        />
        {PLATFORM_LABEL[platform]}
      </div>
      <div
        style={{
          fontSize: "12px",
          color: direction === "in" ? "#22c55e" : "#ef4444",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "4px",
        }}
      >
        {direction === "in" ? (
          <TrendingUp size={13} />
        ) : (
          <TrendingDown size={13} />
        )}
        {label} {formatCurrency(totalAmount)}/day
      </div>
    </div>
  );
}

function BudgetChange({
  label,
  current,
  updated,
  direction,
}: {
  label: string;
  current: number;
  updated: number;
  direction: "increase" | "decrease";
}) {
  const color = direction === "increase" ? "#22c55e" : "#f87171";
  return (
    <div>
      <div
        style={{
          fontSize: "11px",
          color: "#71717a",
          marginBottom: "4px",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span
          style={{
            fontFamily: "var(--font-ibm-plex-mono), monospace",
            fontSize: "14px",
            color: "#71717a",
            textDecoration: "line-through",
          }}
        >
          {formatCurrency(current)}
        </span>
        <ArrowRight size={12} color="#71717a" />
        <span
          style={{
            fontFamily: "var(--font-ibm-plex-mono), monospace",
            fontSize: "16px",
            fontWeight: 600,
            color,
          }}
        >
          {formatCurrency(updated)}
        </span>
      </div>
    </div>
  );
}
