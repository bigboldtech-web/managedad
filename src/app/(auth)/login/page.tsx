"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
      setLoading(false);
    } else {
      router.push("/dashboard");
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

      <h1 style={styles.heading}>Welcome back</h1>
      <p style={styles.sub}>Sign in to your ManagedAd account</p>

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

        <div style={styles.field}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label style={styles.label} htmlFor="password">
              Password
            </label>
            <Link href="/forgot-password" style={styles.forgotLink}>
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <div style={styles.divider}>
        <div style={styles.dividerLine} />
        <span style={styles.dividerText}>or continue with</span>
        <div style={styles.dividerLine} />
      </div>

      <button
        style={styles.btnGoogle}
        onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
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
        Continue with Google
      </button>

      <p style={styles.footer}>
        Don&apos;t have an account?{" "}
        <Link href="/register" style={styles.link}>
          Sign up
        </Link>
      </p>
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
  logoDot: {
    width: "32px",
    height: "32px",
    background: "linear-gradient(135deg, #f97316, #fb923c)",
    borderRadius: "8px",
    flexShrink: 0,
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
  divider: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    margin: "24px 0",
  },
  dividerLine: {
    flex: 1,
    height: "1px",
    background: "#27272e",
  },
  dividerText: {
    fontSize: "11px",
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: "1.5px",
    color: "#71717a",
    whiteSpace: "nowrap" as const,
  },
  btnGoogle: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    width: "100%",
    height: "44px",
    background: "transparent",
    border: "1px solid #27272e",
    borderRadius: "10px",
    color: "#fafafa",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "border-color 0.2s, background 0.2s",
    fontFamily: "inherit",
  },
  footer: {
    marginTop: "24px",
    textAlign: "center" as const,
    fontSize: "13px",
    color: "#71717a",
  },
  link: {
    color: "#fb923c",
    textDecoration: "none",
    fontWeight: 600,
  },
  forgotLink: {
    fontSize: "12px",
    color: "#71717a",
    textDecoration: "none",
    fontWeight: 500,
    transition: "color 0.2s",
  },
};
