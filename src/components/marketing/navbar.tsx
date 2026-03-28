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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  return (
    <nav
      style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        padding: "0 24px",
        transition: "background 0.3s, border-color 0.3s",
        background: scrolled ? "rgba(9,9,11,0.85)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(20px)" : "none",
      }}
    >
      <div
        style={{
          maxWidth: 1200, margin: "0 auto", display: "flex",
          alignItems: "center", justifyContent: "space-between", height: 64,
          borderBottom: scrolled ? "1px solid #27272e" : "1px solid transparent",
        }}
      >
        <Link href="/" style={{ fontFamily: '"Sora", sans-serif', fontWeight: 700, fontSize: 20, letterSpacing: -0.5, color: "#fafafa", textDecoration: "none" }}>
          Managed<span style={{ color: "#fb923c" }}>Ad</span>
        </Link>

        {/* Desktop links */}
        <div className="mkt-desktop-links" style={{ display: "flex", alignItems: "center", gap: 32 }}>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                color: pathname === link.href ? "#fafafa" : "#a1a1aa",
                textDecoration: "none", fontSize: 14, fontWeight: 500,
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#fafafa")}
              onMouseLeave={(e) => { if (pathname !== link.href) e.currentTarget.style.color = "#a1a1aa"; }}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/register"
            style={{
              display: "inline-flex", alignItems: "center", height: 38, padding: "0 20px",
              background: "#f97316", border: "none", borderRadius: 8,
              color: "#fff", fontSize: 13, fontWeight: 600,
              textDecoration: "none", cursor: "pointer", transition: "all 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#fb923c"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#f97316"; e.currentTarget.style.transform = "none"; }}
          >
            Get started
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="mkt-hamburger"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          style={{ display: "none", background: "none", border: "none", color: "#fafafa", cursor: "pointer", padding: 4 }}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="mkt-mobile-menu" style={{
          flexDirection: "column", gap: 4, padding: "16px 24px 24px",
          background: "rgba(9,9,11,0.95)", backdropFilter: "blur(20px)",
          borderBottom: "1px solid #27272e",
        }}>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                display: "block", padding: "12px 0",
                color: pathname === link.href ? "#fafafa" : "#a1a1aa",
                textDecoration: "none", fontSize: 15, fontWeight: 500,
                borderBottom: "1px solid #1f1f25",
              }}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/register"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              height: 44, marginTop: 12, background: "#f97316", borderRadius: 8,
              color: "#fff", fontSize: 15, fontWeight: 600, textDecoration: "none",
            }}
          >
            Get started
          </Link>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .mkt-desktop-links { display: none !important; }
          .mkt-hamburger { display: block !important; }
          .mkt-mobile-menu { display: flex !important; }
        }
      `}</style>
    </nav>
  );
}
