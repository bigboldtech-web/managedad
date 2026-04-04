"use client";

import { useEffect, useState } from "react";
import { Eye, KeyRound, Image, BarChart3, DollarSign, Users, Loader2, ChevronRight } from "lucide-react";

const S = {
  card: { background: "#111114", border: "1px solid #27272e", borderRadius: "12px" } as React.CSSProperties,
};

const REVIEW_META: Record<string, { label: string; icon: any; color: string }> = {
  KEYWORD_REVIEW: { label: "Keyword Review", icon: KeyRound, color: "#34d399" },
  CREATIVE_REVIEW: { label: "Creative Review", icon: Image, color: "#fbbf24" },
  BID_REVIEW: { label: "Bid Review", icon: BarChart3, color: "#818cf8" },
  BUDGET_REVIEW: { label: "Budget Review", icon: DollarSign, color: "#f97316" },
  COMPETITOR_REVIEW: { label: "Competitor Review", icon: Users, color: "#f87171" },
  MONTHLY_DEEP_AUDIT: { label: "Monthly Deep Audit", icon: Eye, color: "#a78bfa" },
};

interface Review {
  id: string;
  reviewType: string;
  weekStart: string;
  summary: string;
  actionsTaken: number;
  createdAt: string;
  data: { findings?: { type: string; impact: string }[]; score?: number };
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reviews")
      .then((r) => r.json())
      .then((d) => setReviews(d.reviews || []))
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h1 style={{ fontFamily: '"Sora", sans-serif', fontSize: "22px", fontWeight: 800, color: "#fafafa", letterSpacing: "-0.5px", marginBottom: "3px" }}>
          Weekly Reviews
        </h1>
        <p style={{ fontSize: "13px", color: "#52525b" }}>
          Automated performance reviews run every week — keywords, creatives, bids, budgets, and competitors.
        </p>
      </div>

      {/* Review schedule */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px" }}>
        {["KEYWORD_REVIEW", "CREATIVE_REVIEW", "BID_REVIEW", "BUDGET_REVIEW", "COMPETITOR_REVIEW"].map((type) => {
          const meta = REVIEW_META[type];
          const latest = reviews.find((r) => r.reviewType === type);
          const Icon = meta.icon;
          return (
            <div key={type} style={{ ...S.card, padding: "16px", textAlign: "center" }}>
              <Icon size={20} color={meta.color} style={{ margin: "0 auto 8px", display: "block" }} />
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#fafafa", marginBottom: "4px" }}>{meta.label}</div>
              <div style={{ fontSize: "10px", color: "#52525b" }}>
                {latest ? `Last: ${new Date(latest.createdAt).toLocaleDateString()}` : "Not yet run"}
              </div>
            </div>
          );
        })}
      </div>

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <div style={{ ...S.card, padding: "40px", textAlign: "center" }}>
          <Eye size={32} color="#3f3f46" style={{ margin: "0 auto 12px" }} />
          <div style={{ fontSize: "15px", fontWeight: 600, color: "#52525b", marginBottom: "4px" }}>No reviews yet</div>
          <div style={{ fontSize: "12px", color: "#3f3f46" }}>
            Reviews run automatically every week when autonomous mode is enabled. Check back on Tuesday!
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {reviews.map((review) => {
            const meta = REVIEW_META[review.reviewType] || { label: review.reviewType, icon: Eye, color: "#52525b" };
            const Icon = meta.icon;
            const findings = (review.data?.findings || []) as { type: string; impact: string }[];
            const highFindings = findings.filter((f) => f.impact === "HIGH").length;
            const wasteFindings = findings.filter((f) => f.type === "WASTE").length;

            return (
              <div key={review.id} style={{ ...S.card, padding: "16px 20px", display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: `${meta.color}10`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={18} color={meta.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#fafafa" }}>{meta.label}</span>
                    <span style={{ fontSize: "10px", color: "#3f3f46" }}>
                      Week of {new Date(review.weekStart).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#71717a", lineHeight: "1.5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {review.summary}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "12px", flexShrink: 0 }}>
                  {highFindings > 0 && (
                    <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "4px", background: "rgba(248,113,113,0.08)", color: "#f87171" }}>
                      {highFindings} critical
                    </span>
                  )}
                  {review.actionsTaken > 0 && (
                    <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "4px", background: "rgba(52,211,153,0.08)", color: "#34d399" }}>
                      {review.actionsTaken} actions
                    </span>
                  )}
                </div>
                <ChevronRight size={14} color="#3f3f46" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
