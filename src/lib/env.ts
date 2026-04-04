/**
 * Environment variable validation.
 * Import this module for side-effect validation at startup:
 *   import "@/lib/env";
 */

const REQUIRED = ["DATABASE_URL", "NEXTAUTH_SECRET", "NEXTAUTH_URL"] as const;

const WARN_IF_MISSING = [
  "ANTHROPIC_API_KEY",
  "SMTP_HOST",
  "SMTP_USER",
  "SMTP_PASS",
  "CRON_SECRET",
  "TOKEN_ENCRYPTION_KEY",
] as const;

const OPTIONAL_PREFIXES = [
  "GOOGLE_ADS_",
  "META_APP_",
  "RAZORPAY_",
  "WHATSAPP_",
] as const;

/**
 * Returns the value of a required environment variable, or throws if missing/empty.
 */
export function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(
      `Missing required environment variable: ${name}. Set it in your .env file or deployment config.`
    );
  }
  return value;
}

/**
 * Validates all environment variables at startup.
 * - REQUIRED vars must be present and non-empty (throws on failure).
 * - WARN_IF_MISSING vars log a console.warn if absent.
 * - Warns if NEXTAUTH_SECRET looks like the dev default.
 */
export function validateEnv(): void {
  // --- Required ---
  const missing: string[] = [];
  for (const name of REQUIRED) {
    const value = process.env[name];
    if (!value || value.trim() === "") {
      missing.push(name);
    }
  }
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}. ` +
        `Set them in your .env file or deployment config.`
    );
  }

  // --- Warn if missing ---
  for (const name of WARN_IF_MISSING) {
    const value = process.env[name];
    if (!value || value.trim() === "") {
      console.warn(
        `[env] Warning: ${name} is not set. Some features may be unavailable.`
      );
    }
  }

  // --- Dev-default secret check ---
  const secret = process.env.NEXTAUTH_SECRET;
  if (secret && secret.startsWith("dev-secret-change")) {
    console.warn(
      `[env] Warning: NEXTAUTH_SECRET looks like the dev default ("${secret.slice(0, 20)}..."). ` +
        `Change it to a strong random value in production.`
    );
  }

  // --- Optional prefix info (no warnings, just for documentation) ---
  // GOOGLE_ADS_*, META_APP_*, RAZORPAY_*, WHATSAPP_* are optional
  // and only needed when integrating with the respective services.
  void OPTIONAL_PREFIXES;
}

// Run validation when this module is imported (skip during Next.js build)
(() => {
  if (process.env.NEXT_PHASE === "phase-production-build") return;

  try {
    validateEnv();
  } catch (error) {
    if (typeof window === "undefined" && process.env.NODE_ENV !== "test") {
      console.error(`[env] ${(error as Error).message}`);
      if (process.env.NODE_ENV === "production") {
        throw error;
      }
    }
  }
})();
