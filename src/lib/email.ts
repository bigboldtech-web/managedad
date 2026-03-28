import nodemailer from "nodemailer";

let _transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!_transporter) {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || "587");
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    if (!host || !user || !pass) throw new Error("SMTP credentials not configured (SMTP_HOST, SMTP_USER, SMTP_PASS)");
    _transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
  }
  return _transporter;
}

const FROM = process.env.SMTP_FROM || "ManagedAd <noreply@managedad.io>";

async function sendMail(to: string, subject: string, html: string): Promise<void> {
  await getTransporter().sendMail({ from: FROM, to, subject, html });
}

export async function sendWelcomeEmail(to: string, name: string) {
  try {
    await sendMail(to, "Welcome to ManagedAd — Your AI Ad Manager is Ready", `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#09090b;font-family:'Segoe UI',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#09090b;padding:40px 20px">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#111114;border:1px solid #27272e;border-radius:16px;overflow:hidden;max-width:580px;width:100%">
        <!-- Header -->
        <tr>
          <td style="padding:32px 36px 24px;border-bottom:1px solid #1f1f25">
            <span style="font-family:'Segoe UI',Arial,sans-serif;font-size:22px;font-weight:800;letter-spacing:-0.5px;color:#fafafa">
              Managed<span style="color:#fb923c">Ad</span>
            </span>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px 36px">
            <h1 style="margin:0 0 12px;font-size:26px;font-weight:800;color:#fafafa;letter-spacing:-0.5px">
              Welcome, ${name}! 🎉
            </h1>
            <p style="margin:0 0 20px;font-size:15px;color:#71717a;line-height:1.6">
              Your ManagedAd account is live. You now have an AI-powered performance marketing engine that works 24/7 to optimize your ad spend.
            </p>
            <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px">
              ${[
                ["Connect your ad accounts", "Link Google Ads or Meta to start syncing campaigns."],
                ["Enable automations", "Turn on budget optimisation, negative keyword mining, and more."],
                ["Get daily reports", "Receive performance digests every morning."],
              ].map(([title, desc]) => `
              <tr>
                <td style="padding:12px 0;border-bottom:1px solid #1f1f25">
                  <span style="display:inline-block;width:8px;height:8px;background:#f97316;border-radius:50%;margin-right:10px;vertical-align:middle"></span>
                  <strong style="color:#fafafa;font-size:14px">${title}</strong>
                  <p style="margin:4px 0 0 18px;font-size:13px;color:#71717a">${desc}</p>
                </td>
              </tr>`).join("")}
            </table>
            <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://managedad.io"}/dashboard"
               style="display:inline-block;padding:13px 28px;background:#f97316;color:#fff;border-radius:10px;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:-0.2px">
              Open Dashboard →
            </a>
          </td>
        </tr>
        <!-- Trial banner -->
        <tr>
          <td style="padding:16px 36px;background:rgba(249,115,22,0.06);border-top:1px solid rgba(249,115,22,0.2)">
            <p style="margin:0;font-size:13px;color:#a1a1aa">
              You&apos;re on a <strong style="color:#f97316">14-day free trial</strong> of the Growth plan. No credit card required until your trial ends.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 36px;border-top:1px solid #1f1f25">
            <p style="margin:0;font-size:12px;color:#3f3f46">
              © 2026 ManagedAd · <a href="https://managedad.io" style="color:#52525b">managedad.io</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`);
  } catch (err) {
    console.error("sendWelcomeEmail error:", err);
  }
}

export async function sendPaymentSuccessEmail(
  to: string,
  name: string,
  plan: string,
  billing: "monthly" | "annual",
  amount: number
) {
  const formattedAmount = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

  try {
    await sendMail(to, `Payment confirmed — ${plan} plan activated`, `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#09090b;font-family:'Segoe UI',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#09090b;padding:40px 20px">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#111114;border:1px solid #27272e;border-radius:16px;overflow:hidden;max-width:580px;width:100%">
        <tr><td style="padding:32px 36px 24px;border-bottom:1px solid #1f1f25">
          <span style="font-size:22px;font-weight:800;color:#fafafa">Managed<span style="color:#fb923c">Ad</span></span>
        </td></tr>
        <tr><td style="padding:32px 36px">
          <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#fafafa">Payment confirmed ✓</h1>
          <p style="margin:0 0 24px;font-size:14px;color:#71717a">Hi ${name}, your subscription is now active.</p>
          <table cellpadding="0" cellspacing="0" style="width:100%;background:#18181c;border-radius:10px;overflow:hidden;margin-bottom:24px">
            ${[
              ["Plan", plan],
              ["Billing", billing === "annual" ? "Annual (20% off)" : "Monthly"],
              ["Amount", formattedAmount],
            ].map(([label, val]) => `
            <tr>
              <td style="padding:12px 16px;font-size:13px;color:#71717a;border-bottom:1px solid #1f1f25">${label}</td>
              <td style="padding:12px 16px;font-size:13px;font-weight:600;color:#fafafa;text-align:right;border-bottom:1px solid #1f1f25">${val}</td>
            </tr>`).join("")}
          </table>
          <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://managedad.io"}/billing"
             style="display:inline-block;padding:12px 24px;background:#f97316;color:#fff;border-radius:10px;font-size:14px;font-weight:700;text-decoration:none">
            View Billing →
          </a>
        </td></tr>
        <tr><td style="padding:20px 36px;border-top:1px solid #1f1f25">
          <p style="margin:0;font-size:12px;color:#3f3f46">© 2026 ManagedAd</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`);
  } catch (err) {
    console.error("sendPaymentSuccessEmail error:", err);
  }
}

export async function sendOptimizationAlertEmail(
  to: string,
  name: string,
  actionCount: number,
  summary: { actionType: string; description: string }[]
) {
  const topActions = summary.slice(0, 5);
  try {
    await sendMail(to, `ManagedAd took ${actionCount} optimisation action${actionCount !== 1 ? "s" : ""} on your campaigns`, `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#09090b;font-family:'Segoe UI',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#09090b;padding:40px 20px">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#111114;border:1px solid #27272e;border-radius:16px;overflow:hidden;max-width:580px;width:100%">
        <tr><td style="padding:32px 36px 24px;border-bottom:1px solid #1f1f25">
          <span style="font-size:22px;font-weight:800;color:#fafafa">Managed<span style="color:#fb923c">Ad</span></span>
        </td></tr>
        <tr><td style="padding:32px 36px">
          <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#fafafa">
            ${actionCount} optimisation action${actionCount !== 1 ? "s" : ""} applied
          </h1>
          <p style="margin:0 0 24px;font-size:14px;color:#71717a">Hi ${name}, here's what ManagedAd did to your campaigns today.</p>
          <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px">
            ${topActions.map(a => `
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #1f1f25">
                <span style="display:inline-block;padding:2px 8px;background:rgba(249,115,22,0.12);color:#f97316;border-radius:4px;font-size:11px;font-weight:700;margin-right:8px">${a.actionType.replace(/_/g, " ")}</span>
                <span style="font-size:13px;color:#a1a1aa">${a.description}</span>
              </td>
            </tr>`).join("")}
            ${actionCount > 5 ? `
            <tr><td style="padding:10px 0;font-size:13px;color:#52525b">+ ${actionCount - 5} more actions…</td></tr>` : ""}
          </table>
          <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://managedad.io"}/automations"
             style="display:inline-block;padding:12px 24px;background:#f97316;color:#fff;border-radius:10px;font-size:14px;font-weight:700;text-decoration:none">
            Review Actions →
          </a>
        </td></tr>
        <tr><td style="padding:20px 36px;border-top:1px solid #1f1f25">
          <p style="margin:0;font-size:12px;color:#3f3f46">© 2026 ManagedAd · <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://managedad.io"}/settings" style="color:#52525b">Manage notifications</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`);
  } catch (err) {
    console.error("sendOptimizationAlertEmail error:", err);
  }
}

// ── Password Reset ───────────────────────────────────────────────────────────

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  resetUrl: string
) {
  try {
    await sendMail(to, "Reset your ManagedAd password", `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#09090b;font-family:'Segoe UI',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#09090b;padding:40px 20px">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#111114;border:1px solid #27272e;border-radius:16px;overflow:hidden;max-width:580px;width:100%">
        <!-- Header -->
        <tr>
          <td style="padding:32px 36px 24px;border-bottom:1px solid #1f1f25">
            <span style="font-family:'Segoe UI',Arial,sans-serif;font-size:22px;font-weight:800;letter-spacing:-0.5px;color:#fafafa">
              Managed<span style="color:#fb923c">Ad</span>
            </span>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px 36px">
            <h1 style="margin:0 0 12px;font-size:24px;font-weight:800;color:#fafafa;letter-spacing:-0.5px">
              Reset your password
            </h1>
            <p style="margin:0 0 8px;font-size:15px;color:#71717a;line-height:1.6">
              Hi ${name}, we received a request to reset the password for your ManagedAd account.
            </p>
            <p style="margin:0 0 24px;font-size:15px;color:#71717a;line-height:1.6">
              Click the button below to set a new password. This link will expire in <strong style="color:#a1a1aa">1 hour</strong>.
            </p>
            <a href="${resetUrl}"
               style="display:inline-block;padding:13px 28px;background:#f97316;color:#fff;border-radius:10px;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:-0.2px">
              Reset Password
            </a>
            <p style="margin:24px 0 0;font-size:13px;color:#52525b;line-height:1.6">
              If you didn&apos;t request this, you can safely ignore this email. Your password will remain unchanged.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 36px;border-top:1px solid #1f1f25">
            <p style="margin:0;font-size:12px;color:#3f3f46">
              &copy; 2026 ManagedAd &middot; <a href="https://managedad.io" style="color:#52525b">managedad.io</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`);
  } catch (err) {
    console.error("sendPasswordResetEmail error:", err);
  }
}

// ── Daily Digest ──────────────────────────────────────────────────────────────

export interface DailyDigestData {
  totalSpend: number;
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
  roas: number;
  topCampaign: string;
  actionsApplied: number;
  fraudBlocked: number;
}

export async function sendDailyDigestEmail(to: string, name: string, data: DailyDigestData) {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://managedad.io";
    await sendMail(to, `ManagedAd Daily Digest — ₹${Math.round(data.totalSpend).toLocaleString("en-IN")} spent · ${data.actionsApplied} actions`, `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#09090b;font-family:'Segoe UI',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#09090b;padding:40px 20px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#111114;border:1px solid #27272e;border-radius:16px;overflow:hidden;max-width:560px;width:100%">
        <tr><td style="padding:28px 32px 20px;border-bottom:1px solid #1f1f25">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
            <span style="background:linear-gradient(135deg,#f97316,#fb923c);padding:6px 10px;border-radius:8px;font-size:13px;font-weight:800;color:#fff">MA</span>
            <span style="font-size:18px;font-weight:800;color:#fafafa">ManagedAd Daily Digest</span>
          </div>
          <p style="margin:0;font-size:14px;color:#71717a">Hi ${name}, here's your account summary for today.</p>
        </td></tr>
        <tr><td style="padding:24px 32px">
          <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px">
            <tr>
              ${[
                { label: "Spend", value: `₹${Math.round(data.totalSpend).toLocaleString("en-IN")}` },
                { label: "Clicks", value: data.totalClicks.toLocaleString("en-IN") },
                { label: "Conversions", value: String(data.totalConversions) },
                { label: "ROAS", value: `${data.roas.toFixed(2)}x` },
              ].map(s => `<td style="width:25%;padding:14px;background:#0d0d10;border-radius:8px;text-align:center;border:1px solid #1a1a1f">
                <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#3f3f46;margin-bottom:4px">${s.label}</div>
                <div style="font-size:20px;font-weight:800;color:#fafafa;font-family:monospace">${s.value}</div>
              </td>`).join('<td style="width:8px"></td>')}
            </tr>
          </table>
          <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px">
            ${[
              { label: "Top Campaign", value: data.topCampaign || "—" },
              { label: "AI Actions Applied", value: String(data.actionsApplied) },
              { label: "Fraud Clicks Blocked", value: String(data.fraudBlocked) },
              { label: "Revenue Tracked", value: `₹${Math.round(data.totalRevenue).toLocaleString("en-IN")}` },
            ].map(row => `<tr>
              <td style="padding:10px 0;border-bottom:1px solid #1f1f25;font-size:13px;color:#71717a">${row.label}</td>
              <td style="padding:10px 0;border-bottom:1px solid #1f1f25;font-size:13px;color:#fafafa;text-align:right;font-weight:600">${row.value}</td>
            </tr>`).join("")}
          </table>
          <a href="${appUrl}/dashboard" style="display:inline-block;padding:12px 24px;background:#f97316;color:#fff;border-radius:10px;font-size:14px;font-weight:700;text-decoration:none">Open Dashboard →</a>
        </td></tr>
        <tr><td style="padding:18px 32px;border-top:1px solid #1f1f25">
          <p style="margin:0;font-size:12px;color:#3f3f46">© 2026 ManagedAd · <a href="${appUrl}/settings" style="color:#52525b">Manage notifications</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`);
  } catch (err) {
    console.error("sendDailyDigestEmail error:", err);
  }
}

// ── Weekly Report ─────────────────────────────────────────────────────────────

export interface WeeklyReportData {
  weekSpend: number;
  weekClicks: number;
  weekConversions: number;
  weekRevenue: number;
  weekRoas: number;
  vsLastWeekSpend: number;  // % change
  vsLastWeekRoas: number;   // % change
  topCampaigns: { name: string; spend: number; roas: number }[];
  auditScore?: number;
  auditSummary?: string;
}

export async function sendWeeklyReportEmail(to: string, name: string, data: WeeklyReportData) {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://managedad.io";
    const spendChange = data.vsLastWeekSpend >= 0 ? `+${data.vsLastWeekSpend.toFixed(1)}%` : `${data.vsLastWeekSpend.toFixed(1)}%`;
    const roasChange = data.vsLastWeekRoas >= 0 ? `+${data.vsLastWeekRoas.toFixed(1)}%` : `${data.vsLastWeekRoas.toFixed(1)}%`;

    await sendMail(to, `ManagedAd Weekly Report — ROAS ${data.weekRoas.toFixed(2)}x · ₹${Math.round(data.weekRevenue).toLocaleString("en-IN")} revenue`, `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#09090b;font-family:'Segoe UI',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#09090b;padding:40px 20px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#111114;border:1px solid #27272e;border-radius:16px;overflow:hidden;max-width:560px;width:100%">
        <tr><td style="padding:28px 32px 20px;border-bottom:1px solid #1f1f25">
          <div style="margin-bottom:16px">
            <span style="background:linear-gradient(135deg,#f97316,#fb923c);padding:6px 10px;border-radius:8px;font-size:13px;font-weight:800;color:#fff">MA</span>
          </div>
          <div style="font-size:20px;font-weight:800;color:#fafafa;margin-bottom:6px">Weekly Performance Report</div>
          <p style="margin:0;font-size:14px;color:#71717a">Hi ${name}, here's how your campaigns performed this week.</p>
        </td></tr>
        <tr><td style="padding:24px 32px">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#3f3f46;margin-bottom:14px">This Week vs Last Week</div>
          <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px">
            <tr>
              ${[
                { label: "Spend", value: `₹${Math.round(data.weekSpend).toLocaleString("en-IN")}`, change: spendChange, up: data.vsLastWeekSpend < 5 },
                { label: "Revenue", value: `₹${Math.round(data.weekRevenue).toLocaleString("en-IN")}`, change: "", up: true },
                { label: "ROAS", value: `${data.weekRoas.toFixed(2)}x`, change: roasChange, up: data.vsLastWeekRoas >= 0 },
                { label: "Conversions", value: String(data.weekConversions), change: "", up: true },
              ].map(s => `<td style="width:25%;padding:12px 10px;background:#0d0d10;border-radius:8px;text-align:center;border:1px solid #1a1a1f">
                <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#3f3f46;margin-bottom:4px">${s.label}</div>
                <div style="font-size:18px;font-weight:800;color:#fafafa;font-family:monospace;margin-bottom:2px">${s.value}</div>
                ${s.change ? `<div style="font-size:11px;color:${s.up ? "#34d399" : "#f87171"};font-weight:600">${s.change}</div>` : ""}
              </td>`).join('<td style="width:6px"></td>')}
            </tr>
          </table>
          ${data.topCampaigns.length > 0 ? `
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#3f3f46;margin-bottom:10px">Top Campaigns</div>
          <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:20px">
            ${data.topCampaigns.slice(0, 5).map(c => `<tr>
              <td style="padding:9px 0;border-bottom:1px solid #1f1f25;font-size:13px;color:#a1a1aa">${c.name}</td>
              <td style="padding:9px 0;border-bottom:1px solid #1f1f25;font-size:12px;color:#71717a;text-align:right">₹${Math.round(c.spend).toLocaleString("en-IN")}</td>
              <td style="padding:9px 0;border-bottom:1px solid #1f1f25;font-size:12px;font-weight:700;color:${c.roas >= 2 ? "#34d399" : c.roas >= 1 ? "#fbbf24" : "#f87171"};text-align:right;width:70px">${c.roas.toFixed(2)}x</td>
            </tr>`).join("")}
          </table>` : ""}
          ${data.auditScore !== undefined ? `
          <div style="padding:14px;background:rgba(249,115,22,0.06);border:1px solid rgba(249,115,22,0.2);border-radius:10px;margin-bottom:20px">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#f97316;margin-bottom:6px">Account Health Score: ${data.auditScore}/100</div>
            <div style="font-size:13px;color:#71717a;line-height:1.6">${data.auditSummary || ""}</div>
          </div>` : ""}
          <a href="${appUrl}/dashboard" style="display:inline-block;padding:12px 24px;background:#f97316;color:#fff;border-radius:10px;font-size:14px;font-weight:700;text-decoration:none">View Full Report →</a>
        </td></tr>
        <tr><td style="padding:18px 32px;border-top:1px solid #1f1f25">
          <p style="margin:0;font-size:12px;color:#3f3f46">© 2026 ManagedAd · <a href="${appUrl}/settings" style="color:#52525b">Manage notifications</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`);
  } catch (err) {
    console.error("sendWeeklyReportEmail error:", err);
  }
}

// ── Email Verification ───────────────────────────────────────────────────────

export async function sendVerificationEmail(to: string, name: string, verifyUrl: string) {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://managedad.io";
    await sendMail(to, "Verify your email — ManagedAd", `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#09090b;font-family:'Segoe UI',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#09090b;padding:40px 20px">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#111114;border:1px solid #27272e;border-radius:16px;overflow:hidden;max-width:580px;width:100%">
        <!-- Header -->
        <tr>
          <td style="padding:32px 36px 24px;border-bottom:1px solid #1f1f25">
            <span style="font-family:'Segoe UI',Arial,sans-serif;font-size:22px;font-weight:800;letter-spacing:-0.5px;color:#fafafa">
              Managed<span style="color:#fb923c">Ad</span>
            </span>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px 36px">
            <h1 style="margin:0 0 12px;font-size:26px;font-weight:800;color:#fafafa;letter-spacing:-0.5px">
              Verify your email
            </h1>
            <p style="margin:0 0 8px;font-size:15px;color:#71717a;line-height:1.6">
              Hi ${name}, thanks for signing up for ManagedAd. Please verify your email address to activate your account.
            </p>
            <p style="margin:0 0 24px;font-size:13px;color:#52525b;line-height:1.6">
              This link expires in 24 hours.
            </p>
            <a href="${verifyUrl}"
               style="display:inline-block;padding:13px 28px;background:#f97316;color:#fff;border-radius:10px;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:-0.2px">
              Verify Email
            </a>
            <p style="margin:24px 0 0;font-size:12px;color:#3f3f46;line-height:1.6">
              If the button doesn't work, copy and paste this URL into your browser:<br>
              <a href="${verifyUrl}" style="color:#52525b;word-break:break-all">${verifyUrl}</a>
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 36px;border-top:1px solid #1f1f25">
            <p style="margin:0;font-size:12px;color:#3f3f46">
              &copy; 2026 ManagedAd &middot; <a href="${appUrl}" style="color:#52525b">managedad.io</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`);
  } catch (err) {
    console.error("sendVerificationEmail error:", err);
  }
}

// ── Monthly Report ──────────────────────────────────────────────────────────

export interface MonthlyReportData {
  monthName: string;
  totalSpend: number;
  totalRevenue: number;
  totalConversions: number;
  roas: number;
  cpa: number;
  vsLastMonthSpend: number;
  vsLastMonthRevenue: number;
  vsLastMonthConversions: number;
  vsLastMonthRoas: number;
  vsLastMonthCpa: number;
  topCampaigns: { name: string; spend: number; roas: number }[];
  optimizationActions: number;
}

export async function sendMonthlyReportEmail(to: string, name: string, data: MonthlyReportData) {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://managedad.io";

    function fmtChange(val: number): string {
      const sign = val >= 0 ? "+" : "";
      return `${sign}${val.toFixed(1)}%`;
    }
    function changeColor(val: number, invertIsGood = false): string {
      const isGood = invertIsGood ? val <= 0 : val >= 0;
      return isGood ? "#34d399" : "#f87171";
    }

    await sendMail(to, `ManagedAd ${data.monthName} Report — ROAS ${data.roas.toFixed(2)}x · ₹${Math.round(data.totalRevenue).toLocaleString("en-IN")} revenue`, `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#09090b;font-family:'Segoe UI',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#09090b;padding:40px 20px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#111114;border:1px solid #27272e;border-radius:16px;overflow:hidden;max-width:560px;width:100%">
        <!-- Header -->
        <tr><td style="padding:28px 32px 20px;border-bottom:1px solid #1f1f25">
          <div style="margin-bottom:16px">
            <span style="background:linear-gradient(135deg,#f97316,#fb923c);padding:6px 10px;border-radius:8px;font-size:13px;font-weight:800;color:#fff">MA</span>
          </div>
          <div style="font-size:20px;font-weight:800;color:#fafafa;margin-bottom:6px">${data.monthName} Performance Report</div>
          <p style="margin:0;font-size:14px;color:#71717a">Hi ${name}, here's your monthly campaign performance summary.</p>
        </td></tr>
        <!-- KPI Grid -->
        <tr><td style="padding:24px 32px">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#3f3f46;margin-bottom:14px">Month-over-Month Performance</div>
          <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:20px">
            <tr>
              ${[
                { label: "Spend", value: `₹${Math.round(data.totalSpend).toLocaleString("en-IN")}`, change: fmtChange(data.vsLastMonthSpend), color: changeColor(data.vsLastMonthSpend, true) },
                { label: "Revenue", value: `₹${Math.round(data.totalRevenue).toLocaleString("en-IN")}`, change: fmtChange(data.vsLastMonthRevenue), color: changeColor(data.vsLastMonthRevenue) },
                { label: "ROAS", value: `${data.roas.toFixed(2)}x`, change: fmtChange(data.vsLastMonthRoas), color: changeColor(data.vsLastMonthRoas) },
              ].map(s => `<td style="width:33%;padding:12px 8px;background:#0d0d10;border-radius:8px;text-align:center;border:1px solid #1a1a1f">
                <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#3f3f46;margin-bottom:4px">${s.label}</div>
                <div style="font-size:18px;font-weight:800;color:#fafafa;font-family:monospace;margin-bottom:2px">${s.value}</div>
                <div style="font-size:11px;color:${s.color};font-weight:600">${s.change}</div>
              </td>`).join('<td style="width:6px"></td>')}
            </tr>
          </table>
          <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:20px">
            <tr>
              ${[
                { label: "Conversions", value: String(data.totalConversions), change: fmtChange(data.vsLastMonthConversions), color: changeColor(data.vsLastMonthConversions) },
                { label: "CPA", value: `₹${Math.round(data.cpa).toLocaleString("en-IN")}`, change: fmtChange(data.vsLastMonthCpa), color: changeColor(data.vsLastMonthCpa, true) },
              ].map(s => `<td style="width:50%;padding:12px 8px;background:#0d0d10;border-radius:8px;text-align:center;border:1px solid #1a1a1f">
                <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#3f3f46;margin-bottom:4px">${s.label}</div>
                <div style="font-size:18px;font-weight:800;color:#fafafa;font-family:monospace;margin-bottom:2px">${s.value}</div>
                <div style="font-size:11px;color:${s.color};font-weight:600">${s.change}</div>
              </td>`).join('<td style="width:6px"></td>')}
            </tr>
          </table>
          <!-- AI Actions -->
          <div style="padding:12px 14px;background:rgba(249,115,22,0.06);border:1px solid rgba(249,115,22,0.2);border-radius:10px;margin-bottom:20px">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#f97316;margin-bottom:4px">AI Optimizations Applied</div>
            <div style="font-size:22px;font-weight:800;color:#fafafa;font-family:monospace">${data.optimizationActions}</div>
          </div>
          ${data.topCampaigns.length > 0 ? `
          <!-- Top Campaigns -->
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#3f3f46;margin-bottom:10px">Top 5 Campaigns by Spend</div>
          <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:20px">
            <tr>
              <td style="padding:8px 0;border-bottom:1px solid #27272e;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#3f3f46">Campaign</td>
              <td style="padding:8px 0;border-bottom:1px solid #27272e;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#3f3f46;text-align:right">Spend</td>
              <td style="padding:8px 0;border-bottom:1px solid #27272e;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#3f3f46;text-align:right;width:70px">ROAS</td>
            </tr>
            ${data.topCampaigns.map(c => `<tr>
              <td style="padding:9px 0;border-bottom:1px solid #1f1f25;font-size:13px;color:#a1a1aa">${c.name}</td>
              <td style="padding:9px 0;border-bottom:1px solid #1f1f25;font-size:12px;color:#71717a;text-align:right">₹${Math.round(c.spend).toLocaleString("en-IN")}</td>
              <td style="padding:9px 0;border-bottom:1px solid #1f1f25;font-size:12px;font-weight:700;color:${c.roas >= 2 ? "#34d399" : c.roas >= 1 ? "#fbbf24" : "#f87171"};text-align:right;width:70px">${c.roas.toFixed(2)}x</td>
            </tr>`).join("")}
          </table>` : ""}
          <a href="${appUrl}/reports" style="display:inline-block;padding:12px 24px;background:#f97316;color:#fff;border-radius:10px;font-size:14px;font-weight:700;text-decoration:none">View Full Report →</a>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:18px 32px;border-top:1px solid #1f1f25">
          <p style="margin:0;font-size:12px;color:#3f3f46">© 2026 ManagedAd · <a href="${appUrl}/settings" style="color:#52525b">Manage notifications</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`);
  } catch (err) {
    console.error("sendMonthlyReportEmail error:", err);
  }
}
