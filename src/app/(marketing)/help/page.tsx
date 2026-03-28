"use client";

import { useState } from "react";
import Link from "next/link";

const TOPICS = [
  {
    icon: "rocket",
    title: "Getting Started",
    description: "Create your account and set up ManagedAd in minutes.",
    href: "/docs#getting-started",
  },
  {
    icon: "link",
    title: "Connect Ad Accounts",
    description: "Link your Google Ads and Meta Ads accounts for syncing.",
    href: "/docs#connect-accounts",
  },
  {
    icon: "zap",
    title: "AI Automations",
    description: "Learn how the AI optimizes your campaigns automatically.",
    href: "/docs#automations",
  },
  {
    icon: "credit-card",
    title: "Billing & Plans",
    description: "View plans, manage your subscription, and payment options.",
    href: "/docs#billing",
  },
  {
    icon: "shield",
    title: "Fraud Detection",
    description: "Understand how ManagedAd detects and blocks click fraud.",
    href: "/docs#fraud",
  },
  {
    icon: "bar-chart",
    title: "Reporting",
    description: "Access performance reports and configure email digests.",
    href: "/docs#reports",
  },
  {
    icon: "settings",
    title: "Account Settings",
    description: "Manage your profile, security, and notification preferences.",
    href: "/docs#settings",
  },
  {
    icon: "help-circle",
    title: "FAQ",
    description: "Answers to the most common questions about ManagedAd.",
    href: "/docs#faq",
  },
];

function TopicIcon({ name }: { name: string }) {
  const icons: Record<string, React.ReactNode> = {
    rocket: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
        <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
        <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
        <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
      </svg>
    ),
    link: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    ),
    zap: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
    "credit-card": (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="14" x="2" y="5" rx="2" />
        <line x1="2" x2="22" y1="10" y2="10" />
      </svg>
    ),
    shield: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    "bar-chart": (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" x2="12" y1="20" y2="10" />
        <line x1="18" x2="18" y1="20" y2="4" />
        <line x1="6" x2="6" y1="20" y2="16" />
      </svg>
    ),
    settings: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    "help-circle": (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <path d="M12 17h.01" />
      </svg>
    ),
  };
  return <>{icons[name] || null}</>;
}

export default function HelpPage() {
  const [search, setSearch] = useState("");

  const filtered = TOPICS.filter(
    (t) =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <head>
        <title>Help Center &mdash; ManagedAd Support</title>
        <meta
          name="description"
          content="Find answers, guides, and support for ManagedAd. Get help with ad accounts, automations, billing, and more."
        />
      </head>

      <div className="help-page">
        {/* Hero */}
        <div className="help-hero">
          <h1 className="help-hero__title">How can we help?</h1>
          <p className="help-hero__subtitle">
            Search our documentation or browse topics below.
          </p>
          <div className="help-search">
            <svg
              className="help-search__icon"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              className="help-search__input"
              placeholder="Search help topics..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Topic Grid */}
        <div className="help-grid">
          {filtered.map((topic) => (
            <Link key={topic.href} href={topic.href} className="help-card">
              <div className="help-card__icon">
                <TopicIcon name={topic.icon} />
              </div>
              <h3 className="help-card__title">{topic.title}</h3>
              <p className="help-card__desc">{topic.description}</p>
              <span className="help-card__arrow">&rarr;</span>
            </Link>
          ))}
          {filtered.length === 0 && (
            <div className="help-empty">
              <p>No topics match your search. Try a different term or browse all documentation.</p>
              <Link href="/docs" className="help-empty__link">
                View full documentation &rarr;
              </Link>
            </div>
          )}
        </div>

        {/* Contact */}
        <div className="help-contact">
          <h2 className="help-contact__title">Still need help?</h2>
          <p className="help-contact__text">
            Our team is here to assist you. Reach out and we will get back to you
            within 24 hours.
          </p>
          <a href="mailto:hello@managedad.com" className="help-contact__btn">
            Email us at hello@managedad.com
          </a>
        </div>
      </div>

      <style>{`
        .help-page {
          max-width: 1100px;
          margin: 0 auto;
          padding: 40px 24px 80px;
        }

        /* Hero */
        .help-hero {
          text-align: center;
          padding: 48px 0 56px;
        }
        .help-hero__title {
          font-size: 42px;
          font-weight: 700;
          color: #fafafa;
          margin: 0 0 12px;
          letter-spacing: -0.5px;
        }
        .help-hero__subtitle {
          font-size: 17px;
          color: #71717a;
          margin: 0 0 32px;
        }
        .help-search {
          position: relative;
          max-width: 520px;
          margin: 0 auto;
        }
        .help-search__icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #52525b;
          pointer-events: none;
        }
        .help-search__input {
          width: 100%;
          padding: 14px 20px 14px 48px;
          font-size: 16px;
          background: #111114;
          border: 1px solid #27272e;
          border-radius: 12px;
          color: #fafafa;
          outline: none;
          transition: border-color 0.2s;
        }
        .help-search__input::placeholder {
          color: #52525b;
        }
        .help-search__input:focus {
          border-color: #f97316;
        }

        /* Grid */
        .help-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 64px;
        }
        .help-card {
          background: #111114;
          border: 1px solid #27272e;
          border-radius: 12px;
          padding: 28px 24px;
          text-decoration: none;
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
          position: relative;
        }
        .help-card:hover {
          border-color: #3f3f46;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
        }
        .help-card__icon {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          background: rgba(249, 115, 22, 0.1);
          color: #f97316;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        }
        .help-card__title {
          font-size: 16px;
          font-weight: 600;
          color: #fafafa;
          margin: 0 0 8px;
        }
        .help-card__desc {
          font-size: 13px;
          line-height: 1.6;
          color: #71717a;
          margin: 0;
          flex: 1;
        }
        .help-card__arrow {
          position: absolute;
          top: 24px;
          right: 20px;
          color: #3f3f46;
          font-size: 18px;
          transition: color 0.2s;
        }
        .help-card:hover .help-card__arrow {
          color: #f97316;
        }

        .help-empty {
          grid-column: 1 / -1;
          text-align: center;
          padding: 48px 24px;
          color: #71717a;
          font-size: 15px;
        }
        .help-empty__link {
          display: inline-block;
          margin-top: 12px;
          color: #f97316;
          text-decoration: none;
          font-weight: 500;
        }
        .help-empty__link:hover {
          text-decoration: underline;
        }

        /* Contact */
        .help-contact {
          text-align: center;
          background: #111114;
          border: 1px solid #27272e;
          border-radius: 16px;
          padding: 48px 24px;
        }
        .help-contact__title {
          font-size: 24px;
          font-weight: 700;
          color: #fafafa;
          margin: 0 0 12px;
        }
        .help-contact__text {
          font-size: 15px;
          color: #71717a;
          margin: 0 0 24px;
          line-height: 1.6;
        }
        .help-contact__btn {
          display: inline-block;
          padding: 12px 28px;
          background: #f97316;
          color: #09090b;
          font-size: 15px;
          font-weight: 600;
          border-radius: 8px;
          text-decoration: none;
          transition: background 0.2s;
        }
        .help-contact__btn:hover {
          background: #fb923c;
        }

        /* Responsive */
        @media (max-width: 900px) {
          .help-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .help-hero__title {
            font-size: 32px;
          }
        }
        @media (max-width: 520px) {
          .help-grid {
            grid-template-columns: 1fr;
          }
          .help-hero__title {
            font-size: 28px;
          }
        }
      `}</style>
    </>
  );
}
