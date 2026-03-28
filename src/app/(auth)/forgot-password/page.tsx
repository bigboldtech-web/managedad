"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Something went wrong");
        setLoading(false);
        return;
      }

      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.card}>
      {/* Logo */}
      <div style={styles.logoWrap}>
        <span style={styles.logoText}>
          Managed<span style={styles.logoSpan}>Ad</span>
        </span>
      </div>

      <h1 style={styles.heading}>Reset your password</h1>
      <p style={styles.sub}>
        Enter your email and we&apos;ll send you a reset link
      </p>

      {sent ? (
        <div style={styles.success}>
          <p style={styles.successText}>
            Check your email for a reset link. If you don&apos;t see it, check
            your spam folder.
          </p>
          <Link href="/login" style={styles.backLink}>
            Back to Sign In
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label} htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            style={{ ...styles.btnPrimary, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>

          <p style={styles.footer}>
            Remember your password?{" "}
            <Link href="/login" style={styles.link}>
              Sign in
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: "#111114",
    border: "1px solid #27272e",
    borderRadius: "16px",
    padding: "40px 36px",
  },
  logoWrap: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "28px",
  },
  logoText: {
    fontFamily: '"Sora", sans-serif',
    fontWeight: 700,
    fontSize: "20px",
    letterSpacing: "-0.5px",
    color: "#fafafa",
  },
  logoSpan: {
    color: "#fb923c",
  },
  heading: {
    fontFamily: '"Sora", sans-serif',
    fontSize: "26px",
    fontWeight: 800,
    letterSpacing: "-0.5px",
    color: "#fafafa",
    marginBottom: "6px",
  },
  sub: {
    fontSize: "14px",
    color: "#71717a",
    marginBottom: "28px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#a1a1aa",
  },
  input: {
    height: "42px",
    padding: "0 14px",
    background: "#18181c",
    border: "1px solid #27272e",
    borderRadius: "8px",
    color: "#fafafa",
    fontSize: "14px",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
    fontFamily: "inherit",
  },
  error: {
    fontSize: "13px",
    color: "#f87171",
    padding: "10px 12px",
    background: "rgba(248,113,113,0.08)",
    borderRadius: "8px",
    border: "1px solid rgba(248,113,113,0.2)",
  },
  success: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "20px",
    padding: "24px 0",
  },
  successText: {
    fontSize: "14px",
    color: "#34d399",
    textAlign: "center" as const,
    lineHeight: "1.6",
    padding: "14px 16px",
    background: "rgba(52,211,153,0.08)",
    borderRadius: "8px",
    border: "1px solid rgba(52,211,153,0.2)",
  },
  backLink: {
    color: "#fb923c",
    textDecoration: "none",
    fontWeight: 600,
    fontSize: "14px",
  },
  btnPrimary: {
    marginTop: "4px",
    height: "44px",
    background: "#f97316",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontSize: "15px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "background 0.2s, transform 0.15s",
    fontFamily: "inherit",
  },
  footer: {
    marginTop: "8px",
    textAlign: "center" as const,
    fontSize: "13px",
    color: "#71717a",
  },
  link: {
    color: "#fb923c",
    textDecoration: "none",
    fontWeight: 600,
  },
};
