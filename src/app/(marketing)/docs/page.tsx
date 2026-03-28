"use client";

import { useEffect, useState, useRef } from "react";
import type { Metadata } from "next";
import Link from "next/link";

const SECTIONS = [
  { id: "getting-started", title: "Getting Started" },
  { id: "connect-accounts", title: "Connect Your Ad Accounts" },
  { id: "dashboard", title: "Understanding the Dashboard" },
  { id: "automations", title: "AI Automations" },
  { id: "optimization", title: "Optimization Settings" },
  { id: "negative-keywords", title: "Negative Keyword Mining" },
  { id: "ai-chat", title: "AI Chat" },
  { id: "creatives", title: "AI Creative Generation" },
  { id: "fraud", title: "Click Fraud Detection" },
  { id: "reports", title: "Reports" },
  { id: "competitors", title: "Competitor Intelligence" },
  { id: "billing", title: "Billing & Plans" },
  { id: "settings", title: "Settings" },
  { id: "faq", title: "FAQ" },
];

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="docs-callout">
      {children}
      <style>{`
        .docs-callout {
          background: #1a1a1f;
          border-left: 3px solid #f97316;
          padding: 16px 20px;
          border-radius: 0 8px 8px 0;
          margin: 16px 0;
          font-size: 14px;
          line-height: 1.7;
          color: #d4d4d8;
        }
      `}</style>
    </div>
  );
}

function Steps({ items }: { items: string[] }) {
  return (
    <ol className="docs-steps">
      {items.map((item, i) => (
        <li key={i} className="docs-step">
          <span className="docs-step__num">{i + 1}</span>
          <span>{item}</span>
        </li>
      ))}
      <style>{`
        .docs-steps {
          list-style: none;
          padding: 0;
          margin: 20px 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .docs-step {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          font-size: 15px;
          line-height: 1.7;
          color: #d4d4d8;
        }
        .docs-step__num {
          flex-shrink: 0;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #f97316;
          color: #09090b;
          font-weight: 700;
          font-size: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 1px;
        }
      `}</style>
    </ol>
  );
}

export default function DocsPage() {
  const [activeId, setActiveId] = useState("getting-started");
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const headings = SECTIONS.map((s) => document.getElementById(s.id)).filter(
      Boolean
    ) as HTMLElement[];

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0.1 }
    );

    headings.forEach((h) => observerRef.current!.observe(h));
    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <>
      <head>
        <title>Documentation &mdash; How to Use ManagedAd</title>
        <meta
          name="description"
          content="Step-by-step guide to using ManagedAd, the AI-powered ad management platform."
        />
      </head>

      <div className="docs-layout">
        {/* Sidebar - desktop */}
        <aside className="docs-sidebar">
          <h4 className="docs-sidebar__title">Documentation</h4>
          <nav className="docs-sidebar__nav">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className={`docs-sidebar__link ${activeId === s.id ? "docs-sidebar__link--active" : ""}`}
                onClick={() => setActiveId(s.id)}
              >
                {s.title}
              </a>
            ))}
          </nav>
        </aside>

        {/* Mobile tabs */}
        <div className="docs-mobile-tabs">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className={`docs-mobile-tab ${activeId === s.id ? "docs-mobile-tab--active" : ""}`}
              onClick={() => setActiveId(s.id)}
            >
              {s.title}
            </a>
          ))}
        </div>

        {/* Content */}
        <div className="docs-content">
          <div className="docs-hero">
            <h1 className="docs-hero__title">ManagedAd Documentation</h1>
            <p className="docs-hero__subtitle">
              Everything you need to know to get started and master AI-powered ad
              management.
            </p>
          </div>

          {/* Getting Started */}
          <section id="getting-started" className="docs-section">
            <h2 className="docs-section__heading">Getting Started</h2>
            <p className="docs-section__text">
              Setting up your ManagedAd account takes less than two minutes. Follow
              these steps to get started.
            </p>
            <Steps
              items={[
                "Sign up at managedad.com/register with your email address.",
                "Check your inbox and click the verification link to confirm your email.",
                "Log in to your dashboard at managedad.com/login and start managing your ads.",
              ]}
            />
            <Callout>
              All new accounts include a 14-day free trial with full access to
              every feature. No credit card required.
            </Callout>
          </section>

          {/* Connect Accounts */}
          <section id="connect-accounts" className="docs-section">
            <h2 className="docs-section__heading">Connect Your Ad Accounts</h2>
            <p className="docs-section__text">
              ManagedAd supports Google Ads and Meta Ads. Connect your accounts to
              start syncing data and enabling AI automations.
            </p>
            <h3 className="docs-section__subheading">Google Ads</h3>
            <Steps
              items={[
                "Go to Settings and click the Connections tab.",
                'Click "Connect Google Ads" to start the OAuth flow.',
                "Sign in with your Google account and grant access.",
                "Select the ad accounts you want to manage.",
              ]}
            />
            <h3 className="docs-section__subheading">Meta Ads</h3>
            <Steps
              items={[
                "Go to Settings and click the Connections tab.",
                'Click "Connect Meta Ads" to start the Facebook login flow.',
                "Sign in with your Facebook account and grant access.",
                "Select the ad accounts you want to manage.",
              ]}
            />
            <Callout>
              Once connected, your data begins syncing automatically every hour.
              Initial sync may take a few minutes depending on account size.
            </Callout>
          </section>

          {/* Dashboard */}
          <section id="dashboard" className="docs-section">
            <h2 className="docs-section__heading">Understanding the Dashboard</h2>
            <p className="docs-section__text">
              The dashboard gives you a real-time overview of your advertising
              performance across all connected platforms.
            </p>
            <h3 className="docs-section__subheading">KPI Cards</h3>
            <p className="docs-section__text">
              At the top of the dashboard, six KPI cards display your key metrics:
              Total Spend, Impressions, Clicks, Conversions, CTR, and ROAS. Each
              card shows the current value and the percentage change from the
              previous period.
            </p>
            <h3 className="docs-section__subheading">Spend Trend Chart</h3>
            <p className="docs-section__text">
              The spend trend chart plots Google Ads and Meta Ads spending over
              time, letting you compare platform performance at a glance.
            </p>
            <h3 className="docs-section__subheading">Platform Breakdown</h3>
            <p className="docs-section__text">
              A pie chart shows the share of spend across Google and Meta, helping
              you understand budget allocation.
            </p>
            <h3 className="docs-section__subheading">Top Campaigns Table</h3>
            <p className="docs-section__text">
              The bottom section lists your top-performing campaigns with key
              metrics like spend, impressions, clicks, and conversions.
            </p>
          </section>

          {/* Automations */}
          <section id="automations" className="docs-section">
            <h2 className="docs-section__heading">AI Automations</h2>
            <p className="docs-section__text">
              ManagedAd&apos;s AI engine continuously analyzes your campaigns and takes
              action to improve performance.
            </p>
            <Steps
              items={[
                "Go to the Automations page from the sidebar.",
                "View all AI actions: negative keyword additions, budget changes, and bid adjustments.",
                "Filter actions by type (e.g., budget, bid, keyword) or status (applied, pending, rolled back).",
                "Each action shows before and after values so you can see exactly what changed.",
                'Click "Rollback" on any action to instantly undo it.',
              ]}
            />
            <Callout>
              Every AI action is logged and reversible. You stay in full control at
              all times.
            </Callout>
          </section>

          {/* Optimization */}
          <section id="optimization" className="docs-section">
            <h2 className="docs-section__heading">Optimization Settings</h2>
            <p className="docs-section__text">
              Fine-tune how the AI optimization engine manages your campaigns.
            </p>
            <Steps
              items={[
                "Go to Optimization and open the Settings panel.",
                "Enable or disable specific automation types (budgets, bids, keywords).",
                "Set thresholds: minimum impressions before acting, ROAS targets, and daily budget limits.",
                'Toggle auto-apply to let the AI act immediately, or keep it in "approval required" mode to review each change before it goes live.',
              ]}
            />
          </section>

          {/* Negative Keywords */}
          <section id="negative-keywords" className="docs-section">
            <h2 className="docs-section__heading">Negative Keyword Mining</h2>
            <p className="docs-section__text">
              ManagedAd automatically discovers wasted search terms and recommends
              negative keywords to save your budget.
            </p>
            <Steps
              items={[
                "Negative keyword mining runs automatically every 6 hours.",
                "Go to the Keywords page to see mined search terms.",
                "Review flagged terms and approve or dismiss each one.",
                "Approved negatives are pushed directly to your Google Ads campaigns.",
              ]}
            />
            <Callout>
              On average, negative keyword mining saves 15-25% of wasted ad spend
              within the first month.
            </Callout>
          </section>

          {/* AI Chat */}
          <section id="ai-chat" className="docs-section">
            <h2 className="docs-section__heading">AI Chat</h2>
            <p className="docs-section__text">
              Ask questions about your ad performance in plain English and get
              data-backed answers instantly.
            </p>
            <Steps
              items={[
                "Go to the Chat page from the sidebar.",
                'Type your question, e.g., "Which campaigns are wasting money?" or "What\'s my best performing ad group this week?"',
                "The AI responds with insights pulled directly from your account data.",
                "Click inline action buttons to take immediate action on recommendations.",
              ]}
            />
          </section>

          {/* Creatives */}
          <section id="creatives" className="docs-section">
            <h2 className="docs-section__heading">AI Creative Generation</h2>
            <p className="docs-section__text">
              Generate high-performing ad copy with AI assistance. ManagedAd
              creates RSA headlines and descriptions tailored to your campaigns.
            </p>
            <Steps
              items={[
                "Go to the Creatives page from the sidebar.",
                "Select a campaign and ad group to generate creatives for.",
                'Click "Generate" and the AI will produce headlines and descriptions.',
                "Review and edit the generated copy to match your brand voice.",
                '"Push as Draft" to send the creative directly to your ad account for final review.',
              ]}
            />
          </section>

          {/* Fraud */}
          <section id="fraud" className="docs-section">
            <h2 className="docs-section__heading">Click Fraud Detection</h2>
            <p className="docs-section__text">
              ManagedAd monitors your click traffic for fraudulent activity and
              automatically protects your budget.
            </p>
            <Steps
              items={[
                "Go to the Fraud page from the sidebar.",
                "View blocked IPs, fraud scores, and estimated savings.",
                "Fraud detection runs automatically in the background.",
                "Suspicious IPs are added to your Google Ads IP exclusion lists to prevent future fraud clicks.",
              ]}
            />
            <Callout>
              Click fraud can waste up to 20% of ad budgets. ManagedAd&apos;s detection
              runs 24/7 to keep your spend protected.
            </Callout>
          </section>

          {/* Reports */}
          <section id="reports" className="docs-section">
            <h2 className="docs-section__heading">Reports</h2>
            <p className="docs-section__text">
              Access detailed performance reports with breakdowns by campaign,
              platform, and time period.
            </p>
            <Steps
              items={[
                "Go to the Reports page from the sidebar.",
                "View weekly performance breakdowns with metrics across all platforms.",
                "Download reports as HTML or PDF for sharing with clients or stakeholders.",
                "Daily digest and weekly report emails are sent automatically.",
                "Configure notification channels in Settings to choose how you receive reports.",
              ]}
            />
          </section>

          {/* Competitors */}
          <section id="competitors" className="docs-section">
            <h2 className="docs-section__heading">Competitor Intelligence</h2>
            <p className="docs-section__text">
              Understand your competitive landscape with Google Auction Insights
              data.
            </p>
            <Steps
              items={[
                "Go to the Competitors page from the sidebar.",
                "View Google Auction Insights data for your campaigns.",
                "See overlap rate, impression share, and position above rate for each competitor.",
                "Threat level indicators (HIGH, MEDIUM, LOW) help you prioritize competitive responses.",
              ]}
            />
          </section>

          {/* Billing */}
          <section id="billing" className="docs-section">
            <h2 className="docs-section__heading">Billing & Plans</h2>
            <p className="docs-section__text">
              ManagedAd offers three plans to fit businesses of every size.
            </p>
            <div className="docs-plans">
              <div className="docs-plan">
                <h4 className="docs-plan__name">Starter</h4>
                <p className="docs-plan__price">&#8377;2,999/mo</p>
                <p className="docs-plan__desc">
                  For small businesses getting started with AI ad management.
                </p>
              </div>
              <div className="docs-plan">
                <h4 className="docs-plan__name">Growth</h4>
                <p className="docs-plan__price">&#8377;7,999/mo</p>
                <p className="docs-plan__desc">
                  For growing brands that need advanced automations and reporting.
                </p>
              </div>
              <div className="docs-plan">
                <h4 className="docs-plan__name">Agency</h4>
                <p className="docs-plan__price">&#8377;19,999/mo</p>
                <p className="docs-plan__desc">
                  For agencies managing multiple client accounts.
                </p>
              </div>
            </div>
            <Steps
              items={[
                "Go to the Billing page from the sidebar.",
                "All plans include a 14-day free trial with full feature access.",
                "Pay via Razorpay: UPI, credit/debit cards, or net banking.",
                "Upgrade, downgrade, or cancel anytime from the Billing page.",
              ]}
            />
          </section>

          {/* Settings */}
          <section id="settings" className="docs-section">
            <h2 className="docs-section__heading">Settings</h2>
            <p className="docs-section__text">
              Manage your account preferences and integrations.
            </p>
            <h3 className="docs-section__subheading">Profile</h3>
            <p className="docs-section__text">
              Update your name and email address.
            </p>
            <h3 className="docs-section__subheading">Security</h3>
            <p className="docs-section__text">
              Change your password and manage login sessions.
            </p>
            <h3 className="docs-section__subheading">Notifications</h3>
            <p className="docs-section__text">
              Enable or disable email, Slack, and WhatsApp alerts for daily
              digests, optimization actions, and weekly reports.
            </p>
            <h3 className="docs-section__subheading">Connections</h3>
            <p className="docs-section__text">
              View and manage your connected Google Ads and Meta Ads accounts.
              Disconnect or reconnect accounts as needed.
            </p>
          </section>

          {/* FAQ */}
          <section id="faq" className="docs-section">
            <h2 className="docs-section__heading">FAQ</h2>

            <div className="docs-faq">
              <div className="docs-faq__item">
                <h4 className="docs-faq__q">Is my data secure?</h4>
                <p className="docs-faq__a">
                  Yes. All data is encrypted with AES-256-GCM both at rest and in
                  transit. Your ad account credentials are stored securely using
                  OAuth tokens and are never exposed.
                </p>
              </div>
              <div className="docs-faq__item">
                <h4 className="docs-faq__q">Can I undo AI actions?</h4>
                <p className="docs-faq__a">
                  Absolutely. Every AI action is logged with before and after
                  values. Click the Rollback button on any action to instantly
                  reverse it.
                </p>
              </div>
              <div className="docs-faq__item">
                <h4 className="docs-faq__q">Which platforms are supported?</h4>
                <p className="docs-faq__a">
                  ManagedAd currently supports Google Ads and Meta Ads (Facebook
                  and Instagram). More platforms are on the roadmap.
                </p>
              </div>
              <div className="docs-faq__item">
                <h4 className="docs-faq__q">How does the free trial work?</h4>
                <p className="docs-faq__a">
                  Every plan includes a 14-day free trial with full feature access.
                  No credit card is required to start. You can upgrade to a paid
                  plan at any time during or after the trial.
                </p>
              </div>
              <div className="docs-faq__item">
                <h4 className="docs-faq__q">What happens when my trial ends?</h4>
                <p className="docs-faq__a">
                  When your trial ends, AI automations pause until you subscribe to
                  a plan. Your data and settings are preserved, so you can pick up
                  right where you left off.
                </p>
              </div>
              <div className="docs-faq__item">
                <h4 className="docs-faq__q">Can I connect multiple accounts?</h4>
                <p className="docs-faq__a">
                  Yes. You can connect multiple Google Ads and Meta Ads accounts
                  depending on your plan. The Agency plan supports unlimited account
                  connections.
                </p>
              </div>
              <div className="docs-faq__item">
                <h4 className="docs-faq__q">How do I cancel?</h4>
                <p className="docs-faq__a">
                  Go to Billing and click Cancel Subscription. Your access
                  continues until the end of the current billing period. There are
                  no cancellation fees.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>

      <style>{`
        .docs-layout {
          display: flex;
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 24px 80px;
          gap: 48px;
          min-height: 100vh;
        }

        /* Sidebar */
        .docs-sidebar {
          width: 240px;
          flex-shrink: 0;
          position: sticky;
          top: 112px;
          align-self: flex-start;
          max-height: calc(100vh - 140px);
          overflow-y: auto;
        }
        .docs-sidebar__title {
          font-size: 13px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #a1a1aa;
          margin: 0 0 16px;
        }
        .docs-sidebar__nav {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .docs-sidebar__link {
          display: block;
          padding: 7px 12px;
          border-radius: 6px;
          font-size: 14px;
          color: #71717a;
          text-decoration: none;
          transition: all 0.15s;
          border-left: 2px solid transparent;
        }
        .docs-sidebar__link:hover {
          color: #d4d4d8;
          background: #111114;
        }
        .docs-sidebar__link--active {
          color: #f97316;
          background: rgba(249, 115, 22, 0.08);
          border-left-color: #f97316;
          font-weight: 500;
        }

        /* Mobile tabs */
        .docs-mobile-tabs {
          display: none;
        }

        /* Content */
        .docs-content {
          flex: 1;
          min-width: 0;
        }

        .docs-hero {
          margin-bottom: 48px;
        }
        .docs-hero__title {
          font-size: 36px;
          font-weight: 700;
          color: #fafafa;
          margin: 0 0 12px;
          letter-spacing: -0.5px;
        }
        .docs-hero__subtitle {
          font-size: 17px;
          color: #71717a;
          margin: 0;
          line-height: 1.6;
        }

        .docs-section {
          margin-bottom: 56px;
          scroll-margin-top: 100px;
        }
        .docs-section__heading {
          font-size: 26px;
          font-weight: 700;
          color: #fafafa;
          margin: 0 0 16px;
          letter-spacing: -0.3px;
          padding-bottom: 12px;
          border-bottom: 1px solid #27272e;
        }
        .docs-section__subheading {
          font-size: 18px;
          font-weight: 600;
          color: #e4e4e7;
          margin: 28px 0 12px;
        }
        .docs-section__text {
          font-size: 15px;
          line-height: 1.7;
          color: #a1a1aa;
          margin: 0 0 12px;
        }

        /* Plans */
        .docs-plans {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin: 20px 0;
        }
        .docs-plan {
          background: #111114;
          border: 1px solid #27272e;
          border-radius: 10px;
          padding: 24px;
        }
        .docs-plan__name {
          font-size: 16px;
          font-weight: 600;
          color: #fafafa;
          margin: 0 0 4px;
        }
        .docs-plan__price {
          font-size: 22px;
          font-weight: 700;
          color: #f97316;
          margin: 0 0 8px;
        }
        .docs-plan__desc {
          font-size: 13px;
          color: #71717a;
          margin: 0;
          line-height: 1.5;
        }

        /* FAQ */
        .docs-faq {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-top: 20px;
        }
        .docs-faq__item {
          background: #111114;
          border: 1px solid #27272e;
          border-radius: 10px;
          padding: 24px;
        }
        .docs-faq__q {
          font-size: 16px;
          font-weight: 600;
          color: #fafafa;
          margin: 0 0 8px;
        }
        .docs-faq__a {
          font-size: 14px;
          line-height: 1.7;
          color: #a1a1aa;
          margin: 0;
        }

        /* Mobile */
        @media (max-width: 900px) {
          .docs-sidebar {
            display: none;
          }
          .docs-mobile-tabs {
            display: flex;
            gap: 8px;
            overflow-x: auto;
            padding: 0 24px 20px;
            margin: -20px -24px 0;
            position: sticky;
            top: 72px;
            background: #09090b;
            z-index: 10;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          .docs-mobile-tabs::-webkit-scrollbar {
            display: none;
          }
          .docs-mobile-tab {
            flex-shrink: 0;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 13px;
            color: #71717a;
            text-decoration: none;
            background: #111114;
            border: 1px solid #27272e;
            white-space: nowrap;
            transition: all 0.15s;
          }
          .docs-mobile-tab--active {
            background: rgba(249, 115, 22, 0.12);
            border-color: #f97316;
            color: #f97316;
          }
          .docs-layout {
            flex-direction: column;
            gap: 0;
            padding: 20px 24px 60px;
          }
          .docs-hero__title {
            font-size: 28px;
          }
          .docs-plans {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
