import type { Metadata } from "next";
import {
  Eye,
  TrendingUp,
  Bot,
  Target,
  Users,
  Zap,
  BarChart3,
} from "lucide-react";
import { JsonLd, organizationSchema } from "@/components/marketing/json-ld";
import { CTASection } from "@/components/marketing/cta-section";

export const metadata: Metadata = {
  title: "About ManagedAd — AI Ad Management for Indian Businesses",
  description:
    "ManagedAd replaces expensive performance marketers with AI. Built by Big Bold Technologies in Mumbai for businesses, agencies, and D2C brands across India.",
};

const STATS = [
  { value: "500+", label: "Campaigns managed" },
  { value: "\u20B910Cr+", label: "Ad spend optimized" },
  { value: "35%", label: "Avg CPA reduction" },
  { value: "24/7", label: "Autonomous optimization" },
];

const VALUES = [
  {
    icon: Eye,
    title: "Transparency",
    description:
      "Every action the AI takes is logged and visible in your dashboard. No black boxes. You can see exactly what changed, why it changed, and what the impact was. Approve, override, or undo any action at any time.",
  },
  {
    icon: TrendingUp,
    title: "Performance",
    description:
      "ROAS-first optimization. Every decision the AI makes is measured against your goals. Budget reallocation, keyword mining, bid adjustments, and creative testing are all driven by conversion data, not vanity metrics.",
  },
  {
    icon: Bot,
    title: "Automation",
    description:
      "Your AI marketer works around the clock. Negative keyword mining every 6 hours. Budget rebalancing daily. Anomaly detection in real time. Click fraud blocking instantly. No weekends off, no sick days.",
  },
];

export default function AboutPage() {
  return (
    <>
      <JsonLd data={organizationSchema()} />

      {/* Hero */}
      <section
        style={{
          textAlign: "center",
          padding: "80px 24px 64px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-40%",
            left: "50%",
            transform: "translateX(-50%)",
            width: 700,
            height: 700,
            background:
              "radial-gradient(circle, rgba(249,115,22,0.1) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div style={{ position: "relative", zIndex: 1 }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: 2,
              color: "#fb923c",
              marginBottom: 12,
            }}
          >
            About Us
          </p>
          <h1
            style={{
              fontFamily: '"Sora", sans-serif',
              fontSize: "clamp(36px, 5vw, 60px)",
              fontWeight: 800,
              letterSpacing: -2,
              lineHeight: 1.08,
              color: "#fafafa",
              margin: "0 0 20px",
            }}
          >
            Built by marketers,
            <br />
            powered by AI
          </h1>
          <p
            style={{
              fontSize: "clamp(15px, 1.3vw, 18px)",
              color: "#a1a1aa",
              maxWidth: 560,
              margin: "0 auto",
              lineHeight: 1.7,
            }}
          >
            ManagedAd replaces expensive performance marketers with autonomous AI
            agents that optimize your ads around the clock.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section style={{ padding: "0 24px 96px" }}>
        <div
          className="m-container"
          style={{
            maxWidth: 800,
            margin: "0 auto",
            textAlign: "center",
          }}
        >
          <div
            style={{
              background: "#111114",
              border: "1px solid #27272e",
              borderRadius: 16,
              padding: "48px 40px",
            }}
          >
            <Target
              size={32}
              color="#f97316"
              style={{ marginBottom: 20 }}
            />
            <h2
              style={{
                fontFamily: '"Sora", sans-serif',
                fontSize: "clamp(22px, 3vw, 30px)",
                fontWeight: 800,
                letterSpacing: -0.5,
                color: "#fafafa",
                margin: "0 0 16px",
              }}
            >
              Our Mission
            </h2>
            <p
              style={{
                fontSize: 16,
                color: "#a1a1aa",
                lineHeight: 1.8,
                maxWidth: 600,
                margin: "0 auto",
              }}
            >
              Performance marketing should not require a team of expensive
              specialists clicking buttons all day. We are building AI that does
              the work of an entire performance marketing team, 24 hours a day,
              at a fraction of the cost. Every Indian business deserves access to
              world-class ad optimization.
            </p>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section style={{ padding: "0 24px 96px" }}>
        <div
          style={{
            maxWidth: 1000,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 24,
          }}
          className="about-two-col"
        >
          <div
            style={{
              background: "#111114",
              border: "1px solid #27272e",
              borderRadius: 16,
              padding: "36px 32px",
            }}
          >
            <h3
              style={{
                fontFamily: '"Sora", sans-serif',
                fontSize: 20,
                fontWeight: 700,
                color: "#f87171",
                margin: "0 0 16px",
                letterSpacing: -0.3,
              }}
            >
              The Problem
            </h3>
            <p
              style={{
                fontSize: 15,
                color: "#a1a1aa",
                lineHeight: 1.75,
                margin: 0,
              }}
            >
              Traditional ad management does not scale. Hiring a performance
              marketer costs ₹40,000-1,00,000/month. Agencies charge 15-20% of
              ad spend. Both check campaigns a few times a day at best. Wasted
              spend from irrelevant clicks, click fraud, and poor budget
              allocation goes unnoticed for weeks. Small and medium businesses
              simply cannot afford the expertise they need.
            </p>
          </div>

          <div
            style={{
              background: "#111114",
              border: "1px solid #27272e",
              borderRadius: 16,
              padding: "36px 32px",
            }}
          >
            <h3
              style={{
                fontFamily: '"Sora", sans-serif',
                fontSize: 20,
                fontWeight: 700,
                color: "#34d399",
                margin: "0 0 16px",
                letterSpacing: -0.3,
              }}
            >
              Our Solution
            </h3>
            <p
              style={{
                fontSize: 15,
                color: "#a1a1aa",
                lineHeight: 1.75,
                margin: 0,
              }}
            >
              ManagedAd works differently. AI agents monitor your campaigns
              every hour, not a few times a day. Negative keywords are mined
              every 6 hours. Budgets rebalance daily based on live ROAS data.
              Click fraud is blocked in real time. Creative fatigue is detected
              and addressed automatically. Everything is logged, transparent, and
              under your control. Starting at ₹2,999/month.
            </p>
          </div>
        </div>

        <style>{`
          @media (max-width: 768px) {
            .about-two-col {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </section>

      {/* Stats */}
      <section
        style={{
          padding: "64px 24px",
          borderTop: "1px solid #1f1f25",
          borderBottom: "1px solid #1f1f25",
        }}
      >
        <div
          style={{
            maxWidth: 1000,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 24,
          }}
          className="about-stats-grid"
        >
          {STATS.map((stat) => (
            <div key={stat.label} style={{ textAlign: "center" }}>
              <div
                style={{
                  fontFamily: '"Sora", sans-serif',
                  fontSize: "clamp(32px, 4vw, 48px)",
                  fontWeight: 800,
                  background:
                    "linear-gradient(135deg, #f97316, #34d399)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {stat.value}
              </div>
              <p
                style={{
                  fontSize: 14,
                  color: "#a1a1aa",
                  marginTop: 4,
                }}
              >
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        <style>{`
          @media (max-width: 768px) {
            .about-stats-grid {
              grid-template-columns: 1fr 1fr !important;
              gap: 32px !important;
            }
          }
          @media (max-width: 480px) {
            .about-stats-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </section>

      {/* Team */}
      <section style={{ padding: "96px 24px" }}>
        <div
          style={{
            maxWidth: 800,
            margin: "0 auto",
            textAlign: "center",
          }}
        >
          <Users
            size={32}
            color="#f97316"
            style={{ marginBottom: 20 }}
          />
          <h2
            style={{
              fontFamily: '"Sora", sans-serif',
              fontSize: "clamp(24px, 3vw, 36px)",
              fontWeight: 800,
              letterSpacing: -1,
              color: "#fafafa",
              margin: "0 0 16px",
            }}
          >
            Built by Big Bold Technologies
          </h2>
          <p
            style={{
              fontSize: 16,
              color: "#a1a1aa",
              lineHeight: 1.8,
              maxWidth: 600,
              margin: "0 auto 32px",
            }}
          >
            We are a Mumbai-based team of performance marketers and engineers who
            spent years managing ad accounts manually. We saw how much time and
            money was wasted on repetitive tasks. So we built the AI tool we
            wished we had. ManagedAd is the result of thousands of hours of
            experience distilled into software.
          </p>

          <div
            style={{
              display: "flex",
              gap: 16,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            {[
              { icon: Zap, label: "Engineering" },
              { icon: BarChart3, label: "Performance Marketing" },
              { icon: Bot, label: "AI & Machine Learning" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  style={{
                    background: "#111114",
                    border: "1px solid #27272e",
                    borderRadius: 12,
                    padding: "20px 28px",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontSize: 14,
                    color: "#a1a1aa",
                    fontWeight: 500,
                  }}
                >
                  <Icon size={18} color="#f97316" />
                  {item.label}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Values */}
      <section style={{ padding: "0 24px 96px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <h2
            style={{
              fontFamily: '"Sora", sans-serif',
              fontSize: "clamp(24px, 3vw, 36px)",
              fontWeight: 800,
              letterSpacing: -1,
              color: "#fafafa",
              textAlign: "center",
              marginBottom: 48,
            }}
          >
            Our values
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 20,
            }}
            className="about-values-grid"
          >
            {VALUES.map((val) => {
              const Icon = val.icon;
              return (
                <div
                  key={val.title}
                  style={{
                    background: "#111114",
                    border: "1px solid #27272e",
                    borderRadius: 16,
                    padding: "32px 28px",
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      background: "rgba(249,115,22,0.1)",
                      border: "1px solid rgba(249,115,22,0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 20,
                    }}
                  >
                    <Icon size={22} color="#f97316" />
                  </div>
                  <h3
                    style={{
                      fontFamily: '"Sora", sans-serif',
                      fontSize: 18,
                      fontWeight: 700,
                      color: "#fafafa",
                      margin: "0 0 10px",
                      letterSpacing: -0.3,
                    }}
                  >
                    {val.title}
                  </h3>
                  <p
                    style={{
                      fontSize: 14,
                      color: "#a1a1aa",
                      lineHeight: 1.7,
                      margin: 0,
                    }}
                  >
                    {val.description}
                  </p>
                </div>
              );
            })}
          </div>

          <style>{`
            @media (max-width: 768px) {
              .about-values-grid {
                grid-template-columns: 1fr !important;
              }
            }
          `}</style>
        </div>
      </section>

      <CTASection
        headline="See what AI can do for your ads"
        subtext="Start your free 14-day trial. No credit card required."
      />
    </>
  );
}
