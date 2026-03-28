"use client";

import { useEffect } from "react";
import Link from "next/link";
import "../landing.css";

export default function LandingPage() {
  useEffect(() => {
    // Scroll reveal
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.08 }
    );
    document.querySelectorAll(".landing .reveal").forEach((el) => obs.observe(el));

    return () => { obs.disconnect(); };
  }, []);

  return (
    <div className="landing">

      {/* ===== HERO ===== */}
      <section className="hero">
        <div className="hero-pill">
          <span className="live" />
          AI agents managing ads 24/7
        </div>
        <h1>
          Let AI manage
          <br />
          your <span className="em">ads</span>
        </h1>
        <p className="hero-sub">
          Automate 90% of your paid advertising. AI agents handle Google Ads,
          Meta, LinkedIn &amp; TikTok — optimizing bids, killing waste, and
          scaling winners autonomously.
        </p>
        <div className="hero-actions">
          <Link href="/register">
            <button className="btn btn-primary">Get started</button>
          </Link>
          <button className="btn btn-ghost">Watch demo</button>
        </div>
        <div className="hero-platforms">
          {/* Google */}
          <div className="plat-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
          </div>
          {/* Meta */}
          <div className="plat-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path
                d="M24 12c0-6.627-5.373-12-12-12S0 5.373 0 12c0 5.99 4.388 10.954 10.125 11.854V15.47H7.078V12h3.047V9.356c0-3.007 1.792-4.668 4.533-4.668 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874V12h3.328l-.532 3.469h-2.796v8.385C19.612 22.954 24 17.99 24 12z"
                fill="#94a3b8"
              />
            </svg>
          </div>
          {/* LinkedIn */}
          <div className="plat-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path
                d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
                fill="#94a3b8"
              />
            </svg>
          </div>
          {/* TikTok */}
          <div className="plat-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path
                d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.3 0 .59.05.86.12V9.01a6.32 6.32 0 00-1-.08 6.29 6.29 0 00-6.29 6.29A6.29 6.29 0 009.49 22a6.29 6.29 0 006.29-6.29V9.4a8.16 8.16 0 004.77 1.53V7.5a4.85 4.85 0 01-.96-.81z"
                fill="#94a3b8"
              />
            </svg>
          </div>
        </div>
      </section>

      {/* ===== PRODUCT SHOWCASE ===== */}
      <section className="showcase">
        <div className="showcase-grid">
          {/* Card 1: Keyword Optimization */}
          <div className="showcase-card">
            <div className="sc-header">
              <div>
                <div className="sc-label">Search Terms</div>
                <div className="sc-title">Keyword optimization</div>
              </div>
            </div>
            <div className="sc-body">
              <table className="kw-table">
                <thead>
                  <tr>
                    <th>Search term</th>
                    <th>Clicks</th>
                    <th>Conv</th>
                    <th>CPA</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="term">&quot;buy laptop online mumbai&quot;</td>
                    <td>84</td>
                    <td>12</td>
                    <td>&#8377;142</td>
                    <td>
                      <span className="kw-action add">&#10003; Scale</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="term">&quot;laptop repair free&quot;</td>
                    <td>47</td>
                    <td>0</td>
                    <td>&mdash;</td>
                    <td>
                      <span className="kw-action block">&#10005; Block</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="term">
                      &quot;laptop price comparison&quot;
                    </td>
                    <td>31</td>
                    <td>2</td>
                    <td>&#8377;410</td>
                    <td>
                      <span className="kw-action watch">&#9673; Watch</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="term">
                      &quot;second hand laptop delhi&quot;
                    </td>
                    <td>63</td>
                    <td>8</td>
                    <td>&#8377;186</td>
                    <td>
                      <span className="kw-action add">&#10003; Scale</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="term">&quot;laptop jobs hiring&quot;</td>
                    <td>29</td>
                    <td>0</td>
                    <td>&mdash;</td>
                    <td>
                      <span className="kw-action block">&#10005; Block</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Card 2: Creative Analysis */}
          <div className="showcase-card">
            <div className="sc-header">
              <div>
                <div className="sc-label">Creatives</div>
                <div className="sc-title">Creative analysis</div>
              </div>
            </div>
            <div className="sc-body">
              <div className="creative-demo">
                {/* A/B creative comparison */}
                <div className="creative-img" style={{
                  padding: "12px",
                  gap: "10px",
                  flexDirection: "column",
                  justifyContent: "flex-start",
                  alignItems: "stretch",
                  background: "#0d0d10",
                  borderRadius: "8px",
                  display: "flex",
                  minHeight: "180px",
                }}>
                  {/* Header */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "8px", fontWeight: 700, color: "#52525b", letterSpacing: "1px", textTransform: "uppercase" }}>A/B Test</span>
                    <span style={{ fontSize: "7.5px", color: "#34d399", fontWeight: 600 }}>● Live</span>
                  </div>

                  {/* Two variants */}
                  <div style={{ display: "flex", gap: "8px", flex: 1 }}>

                    {/* Variant A — Winner */}
                    <div style={{ flex: 1, borderRadius: "8px", overflow: "hidden", border: "1.5px solid rgba(52,211,153,0.4)", position: "relative" }}>
                      <div style={{
                        height: "72px",
                        background: "linear-gradient(135deg, #f97316 0%, #fb923c 60%, #fbbf24 100%)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        position: "relative",
                      }}>
                        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                          <rect x="2" y="7" width="24" height="16" rx="2.5" fill="rgba(255,255,255,0.3)"/>
                          <rect x="4" y="9" width="20" height="12" rx="1.5" fill="rgba(255,255,255,0.4)"/>
                          <circle cx="14" cy="15" r="3.5" fill="rgba(255,255,255,0.6)"/>
                        </svg>
                        <div style={{
                          position: "absolute", top: "4px", left: "4px",
                          padding: "1.5px 5px",
                          background: "#34d399",
                          borderRadius: "3px",
                          fontSize: "6.5px", fontWeight: 800, color: "#000",
                        }}>WINNER</div>
                      </div>
                      <div style={{ background: "#18181c", padding: "6px 7px" }}>
                        <div style={{ height: "5px", background: "#27272e", borderRadius: "2px", width: "90%", marginBottom: "3px" }}/>
                        <div style={{ height: "5px", background: "#27272e", borderRadius: "2px", width: "60%", marginBottom: "5px" }}/>
                        <div style={{ height: "12px", background: "#f97316", borderRadius: "3px", width: "55%" }}/>
                      </div>
                      <div style={{ textAlign: "center", padding: "4px 0 5px", background: "#111114" }}>
                        <span style={{ fontSize: "10px", fontWeight: 800, color: "#34d399" }}>4.8%</span>
                        <span style={{ fontSize: "7px", color: "#52525b", marginLeft: "2px" }}>CTR</span>
                      </div>
                    </div>

                    {/* Variant B — Losing */}
                    <div style={{ flex: 1, borderRadius: "8px", overflow: "hidden", border: "1.5px solid rgba(113,113,122,0.2)", position: "relative", opacity: 0.65 }}>
                      <div style={{
                        height: "72px",
                        background: "linear-gradient(135deg, #27272e 0%, #35353e 100%)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        position: "relative",
                      }}>
                        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                          <rect x="2" y="7" width="24" height="16" rx="2.5" fill="rgba(255,255,255,0.08)"/>
                          <rect x="4" y="9" width="20" height="12" rx="1.5" fill="rgba(255,255,255,0.1)"/>
                          <circle cx="14" cy="15" r="3.5" fill="rgba(255,255,255,0.15)"/>
                        </svg>
                        <div style={{
                          position: "absolute", top: "4px", left: "4px",
                          padding: "1.5px 5px",
                          background: "rgba(248,113,113,0.2)",
                          border: "1px solid rgba(248,113,113,0.3)",
                          borderRadius: "3px",
                          fontSize: "6.5px", fontWeight: 800, color: "#f87171",
                        }}>LOSING</div>
                      </div>
                      <div style={{ background: "#18181c", padding: "6px 7px" }}>
                        <div style={{ height: "5px", background: "#27272e", borderRadius: "2px", width: "90%", marginBottom: "3px" }}/>
                        <div style={{ height: "5px", background: "#27272e", borderRadius: "2px", width: "60%", marginBottom: "5px" }}/>
                        <div style={{ height: "12px", background: "#27272e", borderRadius: "3px", width: "55%" }}/>
                      </div>
                      <div style={{ textAlign: "center", padding: "4px 0 5px", background: "#111114" }}>
                        <span style={{ fontSize: "10px", fontWeight: 800, color: "#71717a" }}>1.2%</span>
                        <span style={{ fontSize: "7px", color: "#52525b", marginLeft: "2px" }}>CTR</span>
                      </div>
                    </div>
                  </div>

                  {/* Recommendation pill */}
                  <div style={{
                    padding: "6px 10px",
                    background: "rgba(52,211,153,0.07)",
                    border: "1px solid rgba(52,211,153,0.2)",
                    borderRadius: "6px",
                    fontSize: "8px", color: "#34d399", lineHeight: 1.4,
                  }}>
                    ↑ Pause B and scale A budget by 40%
                  </div>
                </div>
                <div className="score-list">
                  <div className="score-item">
                    <div className="score-label">
                      <span>CTA Effectiveness</span>
                      <span>72%</span>
                    </div>
                    <div className="score-bar">
                      <div
                        className="score-bar-fill"
                        style={{ width: "72%", background: "var(--yellow)" }}
                      />
                    </div>
                    <div className="score-note">
                      Good urgency but lacks benefit-driven phrasing
                    </div>
                  </div>
                  <div className="score-item">
                    <div className="score-label">
                      <span>Visual Impact</span>
                      <span>91%</span>
                    </div>
                    <div className="score-bar">
                      <div
                        className="score-bar-fill"
                        style={{ width: "91%", background: "var(--green)" }}
                      />
                    </div>
                    <div className="score-note">
                      Strong product visibility, clean composition
                    </div>
                  </div>
                  <div className="score-item">
                    <div className="score-label">
                      <span>Copy Quality</span>
                      <span>58%</span>
                    </div>
                    <div className="score-bar">
                      <div
                        className="score-bar-fill"
                        style={{ width: "58%", background: "var(--red)" }}
                      />
                    </div>
                    <div className="score-note">
                      Generic headline — needs personalization
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Budget Reallocation (wide) */}
          <div className="showcase-card wide">
            <div className="sc-header">
              <div>
                <div className="sc-label">Budget</div>
                <div className="sc-title">Budget reallocation</div>
              </div>
            </div>
            <div className="sc-body">
              <div className="budget-channels">
                <div className="budget-ch">
                  <div className="ch-head">
                    <span className="ch-name">Google Ads</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                        fill="#4285F4"
                      />
                    </svg>
                  </div>
                  <div className="ch-roas" style={{ color: "var(--green)" }}>
                    4.8x
                  </div>
                  <div className="ch-spend">&#8377;1,85,000 spend</div>
                  <div className="ch-change up">&uarr; Budget +15%</div>
                </div>
                <div className="budget-ch">
                  <div className="ch-head">
                    <span className="ch-name">Meta Ads</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" fill="#1877F2" opacity=".6" />
                    </svg>
                  </div>
                  <div className="ch-roas" style={{ color: "var(--green)" }}>
                    3.2x
                  </div>
                  <div className="ch-spend">&#8377;1,20,000 spend</div>
                  <div className="ch-change up">&uarr; Budget +5%</div>
                </div>
                <div className="budget-ch">
                  <div className="ch-head">
                    <span className="ch-name">LinkedIn Ads</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <rect
                        width="20"
                        height="20"
                        x="2"
                        y="2"
                        rx="3"
                        fill="#0A66C2"
                        opacity=".5"
                      />
                    </svg>
                  </div>
                  <div className="ch-roas" style={{ color: "var(--yellow)" }}>
                    1.4x
                  </div>
                  <div className="ch-spend">&#8377;45,000 spend</div>
                  <div className="ch-change down">&darr; Budget &minus;20%</div>
                </div>
                <div className="budget-ch">
                  <div className="ch-head">
                    <span className="ch-name">TikTok Ads</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" fill="#fff" opacity=".3" />
                    </svg>
                  </div>
                  <div className="ch-roas" style={{ color: "var(--red)" }}>
                    0.8x
                  </div>
                  <div className="ch-spend">&#8377;30,000 spend</div>
                  <div className="ch-change down">&darr; Paused</div>
                </div>
              </div>
              <div className="realloc-bar">
                <span className="pulse-dot" />
                <span>
                  Reallocating &#8377;32,000 from underperformers &rarr; Google
                  Ads Brand Search (ROAS 9.2x)
                </span>
              </div>
            </div>
          </div>

          {/* Card 4: Account Audit */}
          <div className="showcase-card">
            <div className="sc-header">
              <div>
                <div className="sc-label">Health</div>
                <div className="sc-title">Account audits</div>
              </div>
            </div>
            <div className="sc-body">
              <div className="audit-items">
                <div className="audit-item">
                  <div className="audit-icon r">!</div>
                  <span className="audit-text">
                    <strong>14 search terms</strong> burning &#8377;18K with 0
                    conversions
                  </span>
                  <span className="audit-savings">+&#8377;18K/mo</span>
                </div>
                <div className="audit-item">
                  <div className="audit-icon y">&#9888;</div>
                  <span className="audit-text">
                    <strong>Conversion tracking</strong> double-counting on 3
                    campaigns
                  </span>
                  <span className="audit-savings">Fix now</span>
                </div>
                <div className="audit-item">
                  <div className="audit-icon g">&#10003;</div>
                  <span className="audit-text">
                    <strong>Brand campaign</strong> ROAS 9.2x — increase budget
                    cap
                  </span>
                  <span className="audit-savings">+&#8377;12K/mo</span>
                </div>
                <div className="audit-item">
                  <div className="audit-icon r">!</div>
                  <span className="audit-text">
                    <strong>Click fraud</strong> detected from 6 IPs — blocked
                  </span>
                  <span className="audit-savings">+&#8377;8K/mo</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 5: AI Suggestions */}
          <div className="showcase-card">
            <div className="sc-header">
              <div>
                <div className="sc-label">Recommendations</div>
                <div className="sc-title">Autonomous AI marketer</div>
              </div>
            </div>
            <div className="sc-body">
              <div className="audit-items">
                <div
                  className="audit-item"
                  style={{
                    borderColor: "var(--accent)",
                    background: "rgba(124,92,252,.04)",
                  }}
                >
                  <span className="audit-text" style={{ fontSize: "12px" }}>
                    Pause 27 queries burning &#8377;1.8L with 0 conversions
                    (30d)
                  </span>
                  <button className="apply-btn">Apply</button>
                </div>
                <div
                  className="audit-item"
                  style={{
                    borderColor: "var(--accent)",
                    background: "rgba(124,92,252,.04)",
                  }}
                >
                  <span className="audit-text" style={{ fontSize: "12px" }}>
                    Split Brand (ROAS 8.2) from Non-Brand (1.6); separate
                    budgets
                  </span>
                  <button className="apply-btn">Apply</button>
                </div>
                <div
                  className="audit-item"
                  style={{
                    borderColor: "var(--accent)",
                    background: "rgba(124,92,252,.04)",
                  }}
                >
                  <span className="audit-text" style={{ fontSize: "12px" }}>
                    Add 85 negatives (&quot;jobs&quot;,&quot;free&quot;,&quot;tutorial&quot;)
                    to block waste
                  </span>
                  <button className="apply-btn">Apply</button>
                </div>
                <div
                  className="audit-item"
                  style={{
                    borderColor: "var(--accent)",
                    background: "rgba(124,92,252,.04)",
                  }}
                >
                  <span className="audit-text" style={{ fontSize: "12px" }}>
                    Fix tracking: dedupe conversion events across 3 campaigns
                  </span>
                  <button className="apply-btn">Apply</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TICKER ===== */}
      <div className="ticker">
        <div className="ticker-track">
          {[...Array(3)].map((_, i) => (
            <div key={i} style={{ display: "contents" }}>
              <div className="ticker-item">
                <span className="dot" />
                850+ BUSINESSES
              </div>
              <div className="ticker-item">
                <span className="dot" />
                120+ AGENCIES
              </div>
              <div className="ticker-item">
                <span className="dot" />
                &#8377;50Cr+ AD SPEND MANAGED
              </div>
              <div className="ticker-item">
                <span className="dot" />
                12 COUNTRIES
              </div>
              <div className="ticker-item">
                <span className="dot" />
                47 AUTOMATIONS
              </div>
              <div className="ticker-item">
                <span className="dot" />
                24/7 OPTIMIZATION
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== FEATURE: AUTONOMOUS AI ===== */}
      <section className="features reveal" id="features">
        <div className="feat-grid l-container">
          <div className="feat-text">
            <div className="feat-tag">Autonomous AI Marketer</div>
            <h2>Your campaigns, optimized every hour</h2>
            <p>
              ManagedAd&apos;s AI agents continuously audit, adjust, and optimize
              — so you don&apos;t have to check your campaigns ever again.
            </p>
            <ul className="feat-bullets">
              <li>24/7 performance monitoring with instant anomaly alerts</li>
              <li>Automatic negative keyword mining every 6 hours</li>
              <li>
                Real-time bid adjustments by device, time &amp; location
              </li>
              <li>Creative fatigue detection and auto-refresh</li>
              <li>Click fraud blocking saves 15-25% wasted spend</li>
            </ul>
          </div>
          <div className="feat-visual">
            <div className="action-feed">
              <div className="action-row">
                <span className="action-badge auto">AUTO</span>
                <span className="action-desc">
                  Paused 14 search terms burning &#8377;18K with 0 conversions
                </span>
                <span className="action-impact">+&#8377;18K</span>
                <span className="action-time">2m ago</span>
              </div>
              <div className="action-row">
                <span className="action-badge optim">OPTIM</span>
                <span className="action-desc">
                  Shifted &#8377;8K from Display (0.9x) &rarr; Brand Search
                  (9.2x)
                </span>
                <span className="action-impact">+&#8377;8K</span>
                <span className="action-time">18m ago</span>
              </div>
              <div className="action-row">
                <span className="action-badge auto">AUTO</span>
                <span className="action-desc">
                  Added 42 negative keywords across 6 campaigns
                </span>
                <span className="action-impact">+&#8377;6K</span>
                <span className="action-time">1h ago</span>
              </div>
              <div className="action-row">
                <span className="action-badge alert">ALERT</span>
                <span className="action-desc">
                  Click fraud from 3 IPs blocked &amp; refund requested
                </span>
                <span className="action-impact">+&#8377;4K</span>
                <span className="action-time">3h ago</span>
              </div>
              <div className="action-row">
                <span className="action-badge optim">OPTIM</span>
                <span className="action-desc">
                  Generated 8 RSA headlines from top search terms
                </span>
                <span className="action-impact">Testing</span>
                <span className="action-time">6h ago</span>
              </div>
              <div className="action-row">
                <span className="action-badge auto">AUTO</span>
                <span className="action-desc">
                  Reduced CPC bids 12% on mobile (low CVR segment)
                </span>
                <span className="action-impact">+&#8377;3K</span>
                <span className="action-time">8h ago</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURE: CHAT INTERFACE ===== */}
      <section className="features reveal">
        <div className="feat-grid reverse l-container">
          <div className="feat-text">
            <div className="feat-tag">Ask Anything</div>
            <h2>ChatGPT for your ad accounts</h2>
            <p>
              Ask questions in plain English (or Hinglish). Get instant answers
              backed by real data from your connected accounts.
            </p>
            <ul className="feat-bullets">
              <li>
                &quot;How can I improve my ROAS on Meta this week?&quot;
              </li>
              <li>&quot;What are my best performing keywords?&quot;</li>
              <li>&quot;Which campaigns are wasting spend?&quot;</li>
              <li>
                &quot;Compare my Google vs Meta performance&quot;
              </li>
            </ul>
          </div>
          <div className="feat-visual">
            <div className="chat-demo">
              <div className="chat-q">Which campaigns are wasting money?</div>
              <div className="chat-a">
                Looking at the last 30 days, I found{" "}
                <strong style={{ color: "var(--text)" }}>3 campaigns</strong>{" "}
                with concerning performance:
                <br />
                <br />
                <strong style={{ color: "var(--red)" }}>1.</strong> &quot;Display
                - Prospecting&quot; — &#8377;42K spent, ROAS 0.3x.{" "}
                <strong style={{ color: "var(--text)" }}>
                  Recommendation: Pause immediately.
                </strong>
                <br />
                <br />
                <strong style={{ color: "var(--yellow)" }}>2.</strong>{" "}
                &quot;Non-Brand - Generic&quot; — &#8377;28K spent, ROAS 1.1x.
                67% of spend on 4 broad match terms with 0 conversions.
                <br />
                <br />
                <strong style={{ color: "var(--green)" }}>3.</strong>{" "}
                &quot;Remarketing - Cart&quot; is actually underbudgeted at ROAS
                8.4x. Suggest increasing by 30%.
                <br />
                <br />
                Total recoverable:{" "}
                <strong style={{ color: "var(--green)" }}>
                  ~&#8377;52K/month
                </strong>
              </div>
              <div className="chat-input">
                <span>Ask about your campaigns...</span>
                <div className="send-btn">&rarr;</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="testimonials reveal" id="testimonials">
        <div className="section-head">
          <div className="tag">Wall of Love</div>
          <h2>
            Trusted by marketers who
            <br />
            want their time back
          </h2>
        </div>
        <div className="testi-grid l-container">
          <div className="testi-card highlight">
            <div className="stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
            <div className="quote">
              &quot;Found wasted spend in search terms we&apos;d never have
              caught manually. Cut those, reallocated budget. ROAS went from 1.8x
              to 4.2x in 3 weeks.&quot;
            </div>
            <div className="author">
              <div className="avatar">RK</div>
              <div className="author-info">
                <div className="name">Rahul Kapoor</div>
                <div className="role">D2C Founder, Mumbai</div>
              </div>
            </div>
          </div>
          <div className="testi-card">
            <div className="testi-stat">
              <div className="stat-num">+63%</div>
              <div className="stat-label">
                better ROAS after switching
                <br />
                to AI-managed campaigns
              </div>
            </div>
          </div>
          <div className="testi-card">
            <div className="stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
            <div className="quote">
              &quot;We were drowning with a 4-person team. ManagedAd handles
              what used to take us 20 hours a week. Now we focus on strategy,
              not clicking buttons.&quot;
            </div>
            <div className="author">
              <div className="avatar">PS</div>
              <div className="author-info">
                <div className="name">Priya Sharma</div>
                <div className="role">Marketing Head, SaaS Startup</div>
              </div>
            </div>
          </div>
          <div className="testi-card">
            <div className="stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
            <div className="quote">
              &quot;The click fraud detection alone saved us &#8377;40K/month.
              We had no idea bots were eating our Google Ads budget. ManagedAd
              caught it on day one.&quot;
            </div>
            <div className="author">
              <div className="avatar">AJ</div>
              <div className="author-info">
                <div className="name">Amit Joshi</div>
                <div className="role">Performance Lead, Agency</div>
              </div>
            </div>
          </div>
          <div className="testi-card highlight">
            <div className="stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
            <div className="quote">
              &quot;Caught that our conversion tracking was double-counting. We
              had no idea for 3 months. Fixed it and our CPA dropped 35%
              overnight.&quot;
            </div>
            <div className="author">
              <div className="avatar">NK</div>
              <div className="author-info">
                <div className="name">Neha Krishnan</div>
                <div className="role">CMO, EdTech Platform</div>
              </div>
            </div>
          </div>
          <div className="testi-card">
            <div className="testi-stat">
              <div className="stat-num">-42%</div>
              <div className="stat-label">
                average CPA reduction
                <br />
                in the first 30 days
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="how reveal" id="how">
        <div className="section-head">
          <div className="tag">How it works</div>
          <h2>Up and running in 10 minutes</h2>
        </div>
        <div className="steps l-container">
          <div className="step">
            <div className="step-num">01</div>
            <h4>Connect accounts</h4>
            <p>
              Link Google Ads, Meta, LinkedIn via OAuth. Read-only first. We
              never touch billing.
            </p>
          </div>
          <div className="step">
            <div className="step-num">02</div>
            <h4>AI audit</h4>
            <p>
              Full account health scan in 5 minutes. Finds wasted spend, broken
              tracking, missed opportunities.
            </p>
          </div>
          <div className="step">
            <div className="step-num">03</div>
            <h4>Set goals</h4>
            <p>
              Define target CPA, ROAS, or lead volume. Set risk tolerance. Choose
              which automations to enable.
            </p>
          </div>
          <div className="step">
            <div className="step-num">04</div>
            <h4>AI takes over</h4>
            <p>
              Your AI marketer optimizes 24/7. Every action logged. Approve or
              override anytime.
            </p>
          </div>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section className="pricing reveal" id="pricing">
        <div className="section-head">
          <div className="tag">Pricing</div>
          <h2>Less than your intern&apos;s stipend</h2>
        </div>
        <div className="price-grid l-container">
          <div className="price-card">
            <div className="price-plan">Starter</div>
            <div className="price-amount">
              &#8377;2,999<span>/mo</span>
            </div>
            <div className="price-desc">
              For businesses spending up to &#8377;1L/month on ads
            </div>
            <ul className="price-features">
              <li>
                <span className="ck">&#10003;</span> 1 ad platform (Google or
                Meta)
              </li>
              <li>
                <span className="ck">&#10003;</span> Daily negative keyword
                mining
              </li>
              <li>
                <span className="ck">&#10003;</span> Budget optimization
              </li>
              <li>
                <span className="ck">&#10003;</span> Click fraud protection
              </li>
              <li>
                <span className="ck">&#10003;</span> Weekly email reports
              </li>
              <li>
                <span className="ck">&#10003;</span> Anomaly alerts
              </li>
            </ul>
            <Link href="/register" className="price-btn outline">
              Start free trial
            </Link>
          </div>
          <div className="price-card pop">
            <div className="price-plan">Growth</div>
            <div className="price-amount">
              &#8377;7,999<span>/mo</span>
            </div>
            <div className="price-desc">
              For businesses spending &#8377;1L&ndash;10L/month on ads
            </div>
            <ul className="price-features">
              <li>
                <span className="ck">&#10003;</span> All platforms (Google, Meta,
                LinkedIn, TikTok)
              </li>
              <li>
                <span className="ck">&#10003;</span> AI creative generation
                (50/mo)
              </li>
              <li>
                <span className="ck">&#10003;</span> Cross-platform budget
                reallocation
              </li>
              <li>
                <span className="ck">&#10003;</span> Competitor intelligence
              </li>
              <li>
                <span className="ck">&#10003;</span> Landing page builder
              </li>
              <li>
                <span className="ck">&#10003;</span> Slack + WhatsApp alerts
              </li>
              <li>
                <span className="ck">&#10003;</span> White-label reports
              </li>
            </ul>
            <Link href="/register" className="price-btn fill">
              Start free trial
            </Link>
          </div>
          <div className="price-card">
            <div className="price-plan">Agency</div>
            <div className="price-amount">
              &#8377;19,999<span>/mo</span>
            </div>
            <div className="price-desc">
              For agencies managing 10+ client accounts
            </div>
            <ul className="price-features">
              <li>
                <span className="ck">&#10003;</span> Everything in Growth
              </li>
              <li>
                <span className="ck">&#10003;</span> Unlimited client accounts
              </li>
              <li>
                <span className="ck">&#10003;</span> Unlimited AI creatives
              </li>
              <li>
                <span className="ck">&#10003;</span> Custom automation rules
              </li>
              <li>
                <span className="ck">&#10003;</span> API access
              </li>
              <li>
                <span className="ck">&#10003;</span> Dedicated account manager
              </li>
              <li>
                <span className="ck">&#10003;</span> Priority support
              </li>
            </ul>
            <a href="#" className="price-btn outline">
              Contact sales
            </a>
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="cta-section reveal">
        <h2>
          Audit your ad account
          <br />
          instantly.
        </h2>
        <p>
          Start your free 14-day trial. No credit card required. See what your
          AI marketer finds in the first 5 minutes.
        </p>
        <div className="cta-btns">
          <Link href="/register">
            <button className="btn btn-primary">Get started &rarr;</button>
          </Link>
          <button className="btn btn-ghost">Book a demo</button>
        </div>
      </section>
    </div>
  );
}
