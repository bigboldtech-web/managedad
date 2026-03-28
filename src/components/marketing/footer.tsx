import Link from "next/link";

const PRODUCT_LINKS = [
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "Blog", href: "/blog" },
  { label: "Changelog", href: "/changelog" },
];

const RESOURCE_LINKS = [
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Help Center", href: "/help" },
];

const LEGAL_LINKS = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Refund Policy", href: "/refund" },
];

export function Footer() {
  return (
    <footer className="mkt-footer">
      <div className="mkt-footer__inner">
        <div className="mkt-footer__top">
          <div className="mkt-footer__brand">
            <Link href="/" className="mkt-footer__logo">
              Managed<span>Ad</span>
            </Link>
            <p className="mkt-footer__tagline">
              AI-powered ad management that replaces performance marketers. Built
              for businesses, agencies, and D2C brands.
            </p>
          </div>

          <div className="mkt-footer__col">
            <h6 className="mkt-footer__heading">Product</h6>
            {PRODUCT_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="mkt-footer__link">
                {link.label}
              </Link>
            ))}
          </div>

          <div className="mkt-footer__col">
            <h6 className="mkt-footer__heading">Resources</h6>
            {RESOURCE_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="mkt-footer__link">
                {link.label}
              </Link>
            ))}
          </div>

          <div className="mkt-footer__col">
            <h6 className="mkt-footer__heading">Legal</h6>
            {LEGAL_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="mkt-footer__link">
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mkt-footer__bottom">
          <span>&copy; 2026 ManagedAd. All rights reserved.</span>
          <span>Built with AI, for the AI era.</span>
        </div>
      </div>

      <style>{`
        .mkt-footer {
          border-top: 1px solid #27272e;
          padding: 64px 24px 32px;
          background: #09090b;
          color: #fafafa;
        }
        .mkt-footer__inner {
          max-width: 1200px;
          margin: 0 auto;
        }
        .mkt-footer__top {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 48px;
          padding-bottom: 48px;
          border-bottom: 1px solid #27272e;
        }
        .mkt-footer__brand {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .mkt-footer__logo {
          font-family: "Sora", sans-serif;
          font-weight: 700;
          font-size: 20px;
          letter-spacing: -0.5px;
          color: #fafafa;
          text-decoration: none;
        }
        .mkt-footer__logo span {
          color: #fb923c;
        }
        .mkt-footer__tagline {
          color: #71717a;
          font-size: 14px;
          line-height: 1.6;
          max-width: 300px;
        }
        .mkt-footer__col {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .mkt-footer__heading {
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #a1a1aa;
          margin: 0 0 4px;
        }
        .mkt-footer__link {
          color: #71717a;
          text-decoration: none;
          font-size: 14px;
          transition: color 0.2s;
        }
        .mkt-footer__link:hover {
          color: #fafafa;
        }
        .mkt-footer__bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 24px;
          font-size: 13px;
          color: #52525b;
        }

        @media (max-width: 768px) {
          .mkt-footer__top {
            grid-template-columns: 1fr 1fr;
            gap: 32px;
          }
          .mkt-footer__brand {
            grid-column: 1 / -1;
          }
          .mkt-footer__bottom {
            flex-direction: column;
            gap: 8px;
            text-align: center;
          }
        }

        @media (max-width: 480px) {
          .mkt-footer__top {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </footer>
  );
}
