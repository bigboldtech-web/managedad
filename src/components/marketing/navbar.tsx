"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

export function Navbar() {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      navRef.current?.classList.toggle("mkt-nav--scrolled", window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <nav ref={navRef} className="mkt-nav">
      <div className="mkt-nav__inner">
        <Link href="/" className="mkt-nav__logo">
          Managed<span>Ad</span>
        </Link>

        {/* Desktop links */}
        <div className="mkt-nav__links">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`mkt-nav__link ${pathname === link.href ? "mkt-nav__link--active" : ""}`}
            >
              {link.label}
            </Link>
          ))}
          <Link href="/register" className="mkt-nav__cta">
            Get started
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="mkt-nav__hamburger"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="mkt-nav__mobile">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`mkt-nav__mobile-link ${pathname === link.href ? "mkt-nav__link--active" : ""}`}
            >
              {link.label}
            </Link>
          ))}
          <Link href="/register" className="mkt-nav__cta mkt-nav__cta--mobile">
            Get started
          </Link>
        </div>
      )}

      <style jsx>{`
        .mkt-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          padding: 0 24px;
          transition: background 0.3s;
        }
        .mkt-nav--scrolled {
          background: rgba(9, 9, 11, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
        .mkt-nav__inner {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 64px;
          border-bottom: 1px solid transparent;
        }
        .mkt-nav--scrolled .mkt-nav__inner {
          border-bottom-color: #27272e;
        }
        .mkt-nav__logo {
          font-family: "Sora", sans-serif;
          font-weight: 700;
          font-size: 20px;
          letter-spacing: -0.5px;
          color: #fafafa;
          text-decoration: none;
        }
        .mkt-nav__logo span {
          color: #fb923c;
        }
        .mkt-nav__links {
          display: flex;
          align-items: center;
          gap: 32px;
        }
        .mkt-nav__link {
          color: #a1a1aa;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition: color 0.2s;
        }
        .mkt-nav__link:hover,
        .mkt-nav__link--active {
          color: #fafafa;
        }
        .mkt-nav__cta {
          display: inline-flex;
          align-items: center;
          height: 38px;
          padding: 0 20px;
          background: #f97316;
          border: none;
          border-radius: 8px;
          color: #fff;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.2s;
        }
        .mkt-nav__cta:hover {
          background: #fb923c;
          transform: translateY(-1px);
        }
        .mkt-nav__hamburger {
          display: none;
          background: none;
          border: none;
          color: #fafafa;
          cursor: pointer;
          padding: 4px;
        }
        .mkt-nav__mobile {
          display: none;
          flex-direction: column;
          gap: 4px;
          padding: 16px 24px 24px;
          background: rgba(9, 9, 11, 0.95);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid #27272e;
        }
        .mkt-nav__mobile-link {
          display: block;
          padding: 12px 0;
          color: #a1a1aa;
          text-decoration: none;
          font-size: 15px;
          font-weight: 500;
          transition: color 0.2s;
          border-bottom: 1px solid #1f1f25;
        }
        .mkt-nav__mobile-link:hover,
        .mkt-nav__mobile-link.mkt-nav__link--active {
          color: #fafafa;
        }
        .mkt-nav__cta--mobile {
          margin-top: 12px;
          justify-content: center;
          height: 44px;
          font-size: 15px;
        }

        @media (max-width: 768px) {
          .mkt-nav__links {
            display: none;
          }
          .mkt-nav__hamburger {
            display: block;
          }
          .mkt-nav__mobile {
            display: flex;
          }
        }
      `}</style>
    </nav>
  );
}
