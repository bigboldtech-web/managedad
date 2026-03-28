import type { Metadata } from "next";
import {
  LayoutDashboard,
  SearchX,
  IndianRupee,
  ShieldAlert,
  Sparkles,
  ClipboardCheck,
  FileBarChart,
  MessageSquare,
  Eye,
  PanelTop,
} from "lucide-react";
import { JsonLd, softwareApplicationSchema } from "@/components/marketing/json-ld";
import { CTASection } from "@/components/marketing/cta-section";

export const metadata: Metadata = {
  title: "Features — AI-Powered Ad Management | ManagedAd",
  description:
    "Explore ManagedAd features: unified dashboard, negative keyword mining, budget optimization, click fraud detection, AI creatives, weekly audits, automated reporting, AI chat, competitor intelligence, and landing page builder.",
};

const FEATURES = [
  {
    icon: LayoutDashboard,
    name: "Unified Dashboard",
    tagline: "All your ad accounts in one view",
    description:
      "Monitor Google Ads, Meta, LinkedIn, and TikTok from a single dashboard. See real-time spend, conversions, ROAS, and CPA across every platform without switching tabs. Custom KPI widgets let you focus on what matters most to your business.",
    bullets: [
      "Cross-platform spend and conversion tracking in real time",
      "Custom KPI cards with goal tracking and trend indicators",
      "Campaign-level drill-down with platform comparison",
      "Multi-account support for agencies managing client portfolios",
    ],
  },
  {
    icon: SearchX,
    name: "Negative Keyword Mining",
    tagline: "Stop wasting money on irrelevant clicks",
    description:
      "Our AI continuously scans your search term reports every 6 hours, identifying queries that waste budget with zero conversions. It automatically suggests or applies negative keywords, saving you thousands in wasted ad spend every month.",
    bullets: [
      "Automated search term analysis every 6 hours across all campaigns",
      "Smart pattern detection groups related waste terms together",
      "One-click apply or fully autonomous blocking mode",
      "Historical waste tracking shows cumulative savings over time",
    ],
  },
  {
    icon: IndianRupee,
    name: "Budget Optimization",
    tagline: "Put every rupee where it performs best",
    description:
      "AI-driven budget reallocation shifts spend from underperforming campaigns to top performers in real time. Cross-platform optimization ensures your total ad budget generates maximum ROAS, whether on Google, Meta, or any other channel.",
    bullets: [
      "Real-time cross-platform budget reallocation based on ROAS",
      "Automatic bid adjustments by device, time of day, and location",
      "Smart pacing prevents overspend and end-of-month budget crunches",
      "Custom rules engine for channel-level budget caps and floors",
    ],
  },
  {
    icon: ShieldAlert,
    name: "Click Fraud Detection",
    tagline: "Block bots and protect your budget",
    description:
      "Sophisticated IP and behavior analysis detects fraudulent clicks from bots, competitors, and click farms. Suspicious IPs are blocked automatically, and refund claims are filed with ad platforms on your behalf. Most customers save 15-25% of wasted spend.",
    bullets: [
      "Real-time IP fingerprinting and behavioral anomaly detection",
      "Automatic IP exclusion lists synced to your ad accounts",
      "Competitor click pattern identification and alerting",
      "Monthly fraud savings report with blocked IP details",
    ],
  },
  {
    icon: Sparkles,
    name: "AI Creative Generation",
    tagline: "Generate high-converting ad copy in seconds",
    description:
      "Generate responsive search ad headlines, descriptions, and social media ad copy using AI trained on millions of high-performing ads. A/B test variations automatically and let the AI learn what resonates with your audience.",
    bullets: [
      "Generate RSA headlines and descriptions from your landing page",
      "Social ad copy for Meta, LinkedIn, and TikTok formats",
      "Automatic A/B testing with statistical significance tracking",
      "Creative fatigue detection and auto-refresh suggestions",
    ],
  },
  {
    icon: ClipboardCheck,
    name: "Weekly Account Audit",
    tagline: "A full health check every week, automatically",
    description:
      "Every week, your AI marketer runs a comprehensive audit: checking conversion tracking, identifying budget leaks, flagging quality score drops, and surfacing growth opportunities. You get an actionable report with one-click fixes.",
    bullets: [
      "Conversion tracking validation catches double-counting issues",
      "Quality Score monitoring with keyword-level recommendations",
      "Budget leak identification with estimated monthly savings",
      "Growth opportunity detection for scaling winning campaigns",
    ],
  },
  {
    icon: FileBarChart,
    name: "Automated Reporting",
    tagline: "Beautiful reports without the busywork",
    description:
      "Schedule daily, weekly, or monthly reports delivered to your inbox or Slack. White-label PDFs with your branding for client reporting. Custom metrics, date comparisons, and executive summaries are generated automatically.",
    bullets: [
      "Scheduled email and Slack delivery on your preferred cadence",
      "White-label PDF reports with custom branding for agencies",
      "Cross-platform performance comparison with trend analysis",
      "Executive summary with AI-generated insights and recommendations",
    ],
  },
  {
    icon: MessageSquare,
    name: "AI Chat Interface",
    tagline: "Ask anything about your campaigns in plain English",
    description:
      "Type questions like \"What are my best performing keywords?\" or \"Why did CPA spike yesterday?\" and get instant, data-backed answers. Supports English and Hinglish. Your personal marketing analyst available 24/7.",
    bullets: [
      "Natural language queries across all connected ad accounts",
      "Data-backed answers with charts and actionable recommendations",
      "Campaign comparison, trend analysis, and anomaly explanations",
      "Supports English, Hindi, and Hinglish queries",
    ],
  },
  {
    icon: Eye,
    name: "Competitor Intelligence",
    tagline: "See what your competitors are doing",
    description:
      "Track competitor ad strategies, messaging changes, and new campaign launches. Get alerts when competitors enter your keywords or change their bidding strategy. Stay one step ahead without manual research.",
    bullets: [
      "Competitor ad copy and landing page monitoring",
      "Auction insights analysis with impression share tracking",
      "Alert notifications when competitors change strategies",
      "Market positioning recommendations based on competitive gaps",
    ],
  },
  {
    icon: PanelTop,
    name: "Landing Page Builder",
    tagline: "Build high-converting pages without code",
    description:
      "Create, test, and optimize landing pages purpose-built for your ad campaigns. Pre-designed templates for lead gen, e-commerce, and app installs. AI suggests copy and layout improvements based on conversion data.",
    bullets: [
      "Drag-and-drop builder with mobile-first responsive templates",
      "A/B testing with automatic traffic splitting and winner selection",
      "Dynamic text replacement synced with ad keywords",
      "Conversion tracking and heatmap analytics built in",
    ],
  },
];

export default function FeaturesPage() {
  return (
    <>
      <JsonLd data={softwareApplicationSchema()} />

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
            Platform Features
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
            Everything you need to
            <br />
            manage ads at scale
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
            10 powerful features working together as your autonomous AI marketing
            team. From keyword mining to creative generation, every tool is
            designed to save you time and maximize ROAS.
          </p>
        </div>
      </section>

      {/* Feature sections */}
      {FEATURES.map((feature, index) => {
        const Icon = feature.icon;
        const isReverse = index % 2 === 1;

        return (
          <section
            key={feature.name}
            style={{
              padding: "80px 24px",
              borderTop: "1px solid #1f1f25",
            }}
          >
            <div
              className="m-container"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 64,
                alignItems: "center",
                direction: isReverse ? "rtl" : "ltr",
              }}
            >
              {/* Text side */}
              <div style={{ direction: "ltr" }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: "rgba(249,115,22,0.1)",
                    border: "1px solid rgba(249,115,22,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 20,
                  }}
                >
                  <Icon size={24} color="#f97316" />
                </div>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: 2,
                    color: "#fb923c",
                    marginBottom: 8,
                  }}
                >
                  {feature.tagline}
                </p>
                <h2
                  style={{
                    fontFamily: '"Sora", sans-serif',
                    fontSize: "clamp(24px, 3vw, 36px)",
                    fontWeight: 800,
                    letterSpacing: -1,
                    lineHeight: 1.15,
                    color: "#fafafa",
                    margin: "0 0 16px",
                  }}
                >
                  {feature.name}
                </h2>
                <p
                  style={{
                    fontSize: 15,
                    color: "#a1a1aa",
                    lineHeight: 1.75,
                    margin: "0 0 24px",
                  }}
                >
                  {feature.description}
                </p>
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  {feature.bullets.map((bullet) => (
                    <li
                      key={bullet}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                        fontSize: 14,
                        color: "#a1a1aa",
                      }}
                    >
                      <span
                        style={{
                          width: 20,
                          height: 20,
                          minWidth: 20,
                          borderRadius: "50%",
                          background: "rgba(52,211,153,0.08)",
                          border: "1px solid rgba(52,211,153,0.2)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginTop: 2,
                          fontSize: 11,
                          color: "#34d399",
                        }}
                      >
                        &#10003;
                      </span>
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Visual side */}
              <div
                style={{
                  direction: "ltr",
                  background: "#111114",
                  border: "1px solid #27272e",
                  borderRadius: 16,
                  padding: 40,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: 320,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: 200,
                    height: 200,
                    background:
                      "radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 70%)",
                    pointerEvents: "none",
                  }}
                />
                <Icon
                  size={80}
                  color="#27272e"
                  strokeWidth={1}
                  style={{ opacity: 0.6 }}
                />
              </div>
            </div>

            <style>{`
              @media (max-width: 900px) {
                .m-container {
                  grid-template-columns: 1fr !important;
                  direction: ltr !important;
                  gap: 32px !important;
                }
              }
            `}</style>
          </section>
        );
      })}

      <CTASection
        headline="Ready to automate your ad management?"
        subtext="Start your free 14-day trial. See what your AI marketer finds in the first 5 minutes."
      />
    </>
  );
}
