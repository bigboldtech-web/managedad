import type { Metadata } from "next";
import Link from "next/link";
import { Check, Minus } from "lucide-react";
import { JsonLd, faqSchema } from "@/components/marketing/json-ld";
import { CTASection } from "@/components/marketing/cta-section";

export const metadata: Metadata = {
  title: "Pricing — Plans for Every Business Size | ManagedAd",
  description:
    "ManagedAd pricing starts at INR 2,999/mo. Choose Starter, Growth, or Agency plans. AI-powered ad management for Google Ads and Meta with 14-day free trial.",
};

const PLANS = [
  {
    name: "Starter",
    price: "2,999",
    period: "/mo",
    description: "For businesses spending up to ₹1L/month on ads",
    popular: false,
    cta: "Start free trial",
    ctaHref: "/register",
    features: [
      "1 ad platform (Google or Meta)",
      "Daily negative keyword mining",
      "Budget optimization",
      "Click fraud protection",
      "Weekly email reports",
      "Anomaly alerts",
      "Email support",
    ],
  },
  {
    name: "Growth",
    price: "7,999",
    period: "/mo",
    description: "For businesses spending ₹1L\u201310L/month on ads",
    popular: true,
    cta: "Start free trial",
    ctaHref: "/register",
    features: [
      "All platforms (Google, Meta, LinkedIn, TikTok)",
      "AI creative generation (50/mo)",
      "Cross-platform budget reallocation",
      "Competitor intelligence",
      "Landing page builder",
      "Slack + WhatsApp alerts",
      "White-label reports",
      "AI chat interface",
      "Priority email + chat support",
    ],
  },
  {
    name: "Agency",
    price: "19,999",
    period: "/mo",
    description: "For agencies managing 10+ client accounts",
    popular: false,
    cta: "Contact sales",
    ctaHref: "/contact",
    features: [
      "Everything in Growth",
      "Unlimited client accounts",
      "Unlimited AI creatives",
      "Custom automation rules",
      "API access",
      "Dedicated account manager",
      "Priority support (Slack channel)",
      "Custom onboarding",
    ],
  },
];

const COMPARISON_FEATURES = [
  { name: "Ad platforms", starter: "1", growth: "All", agency: "All" },
  { name: "Negative keyword mining", starter: true, growth: true, agency: true },
  { name: "Budget optimization", starter: true, growth: true, agency: true },
  { name: "Click fraud detection", starter: true, growth: true, agency: true },
  { name: "AI creative generation", starter: false, growth: "50/mo", agency: "Unlimited" },
  { name: "Cross-platform reallocation", starter: false, growth: true, agency: true },
  { name: "Competitor intelligence", starter: false, growth: true, agency: true },
  { name: "Landing page builder", starter: false, growth: true, agency: true },
  { name: "AI chat interface", starter: false, growth: true, agency: true },
  { name: "White-label reports", starter: false, growth: true, agency: true },
  { name: "Slack + WhatsApp alerts", starter: false, growth: true, agency: true },
  { name: "Custom automation rules", starter: false, growth: false, agency: true },
  { name: "API access", starter: false, growth: false, agency: true },
  { name: "Client accounts", starter: "1", growth: "3", agency: "Unlimited" },
  { name: "Dedicated account manager", starter: false, growth: false, agency: true },
  { name: "Support", starter: "Email", growth: "Priority email + chat", agency: "Priority + Slack" },
];

const FAQS = [
  {
    question: "Is there a free trial?",
    answer:
      "Yes, all plans come with a 14-day free trial. No credit card required. You get full access to all features in your chosen plan during the trial.",
  },
  {
    question: "Can I switch plans later?",
    answer:
      "Absolutely. You can upgrade or downgrade your plan at any time from your dashboard. When upgrading, you get immediate access to new features. When downgrading, changes take effect at the next billing cycle.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit and debit cards, UPI, net banking, and wallets through Razorpay. Annual plans can also be paid via bank transfer.",
  },
  {
    question: "Is there an annual discount?",
    answer:
      "Yes, annual billing saves you 20% compared to monthly. Starter is ₹28,790/year, Growth is ₹76,790/year, and Agency is ₹1,91,990/year.",
  },
  {
    question: "What happens when my trial ends?",
    answer:
      "You will be notified before your trial expires. If you do not add a payment method, your account is paused (not deleted). Your data is retained for 30 days so you can resume anytime.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes, there are no lock-in contracts. Cancel from your dashboard and your plan remains active until the end of the current billing period. We do not charge cancellation fees.",
  },
  {
    question: "Do you offer refunds?",
    answer:
      "We offer a full refund within the first 7 days of any paid subscription. After that, you can cancel and your plan will run until the end of the billing period.",
  },
  {
    question: "Is my ad account data safe?",
    answer:
      "Yes. We use read-only OAuth connections to your ad platforms by default. Write access is only enabled for features you explicitly turn on (like automated negative keywords). All data is encrypted at rest and in transit.",
  },
  {
    question: "Do I need technical knowledge to use ManagedAd?",
    answer:
      "Not at all. ManagedAd is designed for business owners and marketers, not developers. Connecting your ad accounts takes 2 minutes via OAuth, and the AI handles everything from there.",
  },
  {
    question: "What ad platforms are supported?",
    answer:
      "Currently we support Google Ads and Meta Ads (Facebook and Instagram). LinkedIn Ads and TikTok Ads support is coming soon. The Starter plan includes one platform; Growth and Agency include all.",
  },
];

export default function PricingPage() {
  return (
    <>
      <JsonLd data={faqSchema(FAQS)} />

      {/* Hero */}
      <section
        style={{
          textAlign: "center",
          padding: "80px 24px 48px",
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
            Pricing
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
            Simple, transparent pricing
          </h1>
          <p
            style={{
              fontSize: "clamp(15px, 1.3vw, 18px)",
              color: "#a1a1aa",
              maxWidth: 520,
              margin: "0 auto",
              lineHeight: 1.7,
            }}
          >
            Less than your intern&apos;s stipend. Every plan includes a 14-day
            free trial with no credit card required.
          </p>
        </div>
      </section>

      {/* Plan cards */}
      <section style={{ padding: "0 24px 96px" }}>
        <div
          className="pricing-grid"
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 20,
            alignItems: "start",
          }}
        >
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              style={{
                background: plan.popular
                  ? "linear-gradient(180deg, rgba(249,115,22,0.06), #111114)"
                  : "#111114",
                border: `1px solid ${plan.popular ? "#f97316" : "#27272e"}`,
                borderRadius: 16,
                padding: "36px 28px",
                position: "relative",
                transition: "all 0.3s",
              }}
            >
              {plan.popular && (
                <div
                  style={{
                    position: "absolute",
                    top: -11,
                    left: "50%",
                    transform: "translateX(-50%)",
                    padding: "4px 14px",
                    background: "#f97316",
                    borderRadius: 100,
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#fff",
                    whiteSpace: "nowrap",
                  }}
                >
                  Most Popular
                </div>
              )}

              <p
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: 2,
                  color: "#71717a",
                  marginBottom: 16,
                  marginTop: 0,
                }}
              >
                {plan.name}
              </p>

              <div
                style={{
                  fontFamily: '"Sora", sans-serif',
                  fontSize: 42,
                  fontWeight: 800,
                  letterSpacing: -1,
                  color: "#fafafa",
                }}
              >
                &#8377;{plan.price}
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 400,
                    color: "#71717a",
                    fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
                  }}
                >
                  {plan.period}
                </span>
              </div>

              <p
                style={{
                  fontSize: 13,
                  color: "#71717a",
                  margin: "8px 0 28px",
                  lineHeight: 1.5,
                }}
              >
                {plan.description}
              </p>

              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: "0 0 28px",
                }}
              >
                {plan.features.map((feat) => (
                  <li
                    key={feat}
                    style={{
                      padding: "8px 0",
                      fontSize: 13,
                      color: "#a1a1aa",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Check size={14} color="#34d399" />
                    {feat}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.ctaHref}
                style={{
                  display: "block",
                  width: "100%",
                  height: 44,
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 600,
                  textAlign: "center",
                  lineHeight: "44px",
                  textDecoration: "none",
                  transition: "all 0.25s",
                  background: plan.popular ? "#f97316" : "transparent",
                  color: plan.popular ? "#fff" : "#fafafa",
                  border: plan.popular ? "none" : "1px solid #27272e",
                  boxSizing: "border-box",
                }}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <style>{`
          @media (max-width: 900px) {
            .pricing-grid {
              grid-template-columns: 1fr !important;
              max-width: 420px !important;
            }
          }
        `}</style>
      </section>

      {/* Feature comparison table */}
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
            Full feature comparison
          </h2>

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 14,
                minWidth: 600,
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid #27272e",
                  }}
                >
                  <th
                    style={{
                      textAlign: "left",
                      padding: "12px 16px",
                      color: "#71717a",
                      fontSize: 12,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: 1,
                    }}
                  >
                    Feature
                  </th>
                  <th
                    style={{
                      textAlign: "center",
                      padding: "12px 16px",
                      color: "#71717a",
                      fontSize: 12,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: 1,
                    }}
                  >
                    Starter
                  </th>
                  <th
                    style={{
                      textAlign: "center",
                      padding: "12px 16px",
                      color: "#f97316",
                      fontSize: 12,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: 1,
                    }}
                  >
                    Growth
                  </th>
                  <th
                    style={{
                      textAlign: "center",
                      padding: "12px 16px",
                      color: "#71717a",
                      fontSize: 12,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: 1,
                    }}
                  >
                    Agency
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_FEATURES.map((row) => (
                  <tr
                    key={row.name}
                    style={{ borderBottom: "1px solid #1f1f25" }}
                  >
                    <td
                      style={{
                        padding: "12px 16px",
                        color: "#a1a1aa",
                        fontWeight: 500,
                      }}
                    >
                      {row.name}
                    </td>
                    <td style={{ textAlign: "center", padding: "12px 16px" }}>
                      <CellValue value={row.starter} />
                    </td>
                    <td style={{ textAlign: "center", padding: "12px 16px" }}>
                      <CellValue value={row.growth} />
                    </td>
                    <td style={{ textAlign: "center", padding: "12px 16px" }}>
                      <CellValue value={row.agency} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: "0 24px 96px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
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
            Frequently asked questions
          </h2>

          <div
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            {FAQS.map((faq) => (
              <div
                key={faq.question}
                style={{
                  background: "#111114",
                  border: "1px solid #27272e",
                  borderRadius: 12,
                  padding: "24px 28px",
                }}
              >
                <h3
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: "#fafafa",
                    margin: "0 0 10px",
                  }}
                >
                  {faq.question}
                </h3>
                <p
                  style={{
                    fontSize: 14,
                    color: "#a1a1aa",
                    lineHeight: 1.7,
                    margin: 0,
                  }}
                >
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CTASection
        headline="Start your free trial today"
        subtext="14-day free trial. No credit card required. Cancel anytime."
      />
    </>
  );
}

function CellValue({ value }: { value: boolean | string }) {
  if (value === true) {
    return <Check size={16} color="#34d399" />;
  }
  if (value === false) {
    return <Minus size={16} color="#52525b" />;
  }
  return (
    <span style={{ fontSize: 13, color: "#a1a1aa" }}>{value}</span>
  );
}
