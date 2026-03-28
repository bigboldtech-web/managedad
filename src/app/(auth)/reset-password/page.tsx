"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Something went wrong");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div style={styles.card}>
        <div style={styles.logoWrap}>
          <span style={styles.logoText}>
            Managed<span style={styles.logoSpan}>Ad</span>
          </span>
        </div>
        <h1 style={styles.heading}>Invalid reset link</h1>
        <p style={styles.sub}>
          This password reset link is invalid or has expired.
        </p>
        <Link href="/forgot-password" style={styles.backLink}>
          Request a new reset link
        </Link>
      </div>
    );
  }

  return (
    <div style={styles.card}>
      {/* Logo */}
      <div style={styles.logoWrap}>
        <span style={styles.logoText}>
          Managed<span style={styles.logoSpan}>Ad</span>
        </span>
      </div>

      <h1 style={styles.heading}>Set new password</h1>
      <p style={styles.sub}>Enter your new password below</p>

      {success ? (
        <div style={styles.success}>
          <p style={styles.successText}>
            Password reset successfully. Redirecting to login...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label} htmlFor="password">
              New Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label} htmlFor="confirmPassword">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              style={styles.input}
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            style={{ ...styles.btnPrimary, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Resetting..." : "Reset Password"}
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div style={styles.card}>
          <p style={{ color: "#71717a", textAlign: "center" }}>Loading...</p>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
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
    display: "inline-block",
    marginTop: "8px",
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
