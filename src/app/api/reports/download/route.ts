import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function formatINR(n: number): string {
  return "₹" + n.toLocaleString("en-IN");
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;
  const range = new URL(req.url).searchParams.get("range") || "90d";
  const days = range === "30d" ? 30 : range === "180d" ? 180 : range === "weekly" ? 7 : 90;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const rangeLabel =
    range === "30d" ? "Last 30 Days" :
    range === "180d" ? "Last 6 Months" :
    range === "weekly" ? "Last 7 Days" :
    "Last 90 Days";

  // ---- Fetch data (same queries as /api/reports) ----
  const [dailyRows, auditReports, topCampaigns] = await Promise.all([
    prisma.dailyMetric.findMany({
      where: { campaign: { userId }, date: { gte: since } },
      select: {
        date: true,
        platform: true,
        spend: true,
        revenue: true,
        clicks: true,
        conversions: true,
        impressions: true,
      },
      orderBy: { date: "asc" },
    }),
    prisma.auditReport.findMany({
      where: { userId, createdAt: { gte: since } },
      select: { score: true, summary: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 1,
    }),
    prisma.campaign.findMany({
      where: { userId, status: { in: ["ACTIVE", "PAUSED"] } },
      select: {
        name: true,
        platform: true,
        status: true,
        spend: true,
        revenue: true,
        clicks: true,
        conversions: true,
        impressions: true,
      },
      orderBy: { spend: "desc" },
      take: 10,
    }),
  ]);

  // ---- Aggregate into weekly buckets ----
  const weekMap = new Map<
    string,
    { weekStart: Date; spend: number; revenue: number; clicks: number; conversions: number; impressions: number; google: number; meta: number }
  >();

  for (const row of dailyRows) {
    const d = new Date(row.date);
    const day = d.getUTCDay();
    const diff = day === 0 ? -6 : 1 - day;
    const weekStart = new Date(d);
    weekStart.setUTCDate(d.getUTCDate() + diff);
    weekStart.setUTCHours(0, 0, 0, 0);
    const key = weekStart.toISOString();

    const existing = weekMap.get(key) || {
      weekStart,
      spend: 0, revenue: 0, clicks: 0, conversions: 0, impressions: 0,
      google: 0, meta: 0,
    };
    const spend = Number(row.spend);
    existing.spend += spend;
    existing.revenue += Number(row.revenue);
    existing.clicks += Number(row.clicks);
    existing.conversions += row.conversions;
    existing.impressions += Number(row.impressions);
    if (row.platform === "GOOGLE_ADS") existing.google += spend;
    else existing.meta += spend;
    weekMap.set(key, existing);
  }

  const weeks = Array.from(weekMap.values())
    .sort((a, b) => b.weekStart.getTime() - a.weekStart.getTime())
    .map((w) => ({
      weekLabel: w.weekStart.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }),
      spend: Math.round(w.spend),
      revenue: Math.round(w.revenue),
      clicks: w.clicks,
      conversions: w.conversions,
      impressions: w.impressions,
      roas: w.spend > 0 ? parseFloat((w.revenue / w.spend).toFixed(2)) : 0,
      ctr: w.impressions > 0 ? parseFloat(((w.clicks / w.impressions) * 100).toFixed(2)) : 0,
      cpa: w.conversions > 0 ? Math.round(w.spend / w.conversions) : 0,
      google: Math.round(w.google),
      meta: Math.round(w.meta),
    }));

  // ---- Totals ----
  const totalSpend = weeks.reduce((s, w) => s + w.spend, 0);
  const totalRevenue = weeks.reduce((s, w) => s + w.revenue, 0);
  const totalConversions = weeks.reduce((s, w) => s + w.conversions, 0);
  const totalClicks = weeks.reduce((s, w) => s + w.clicks, 0);
  const totalImpressions = weeks.reduce((s, w) => s + w.impressions, 0);
  const overallRoas = totalSpend > 0 ? (totalRevenue / totalSpend).toFixed(2) : "0.00";
  const overallCPA = totalConversions > 0 ? Math.round(totalSpend / totalConversions) : 0;
  const overallCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0.00";

  // ---- Platform split ----
  const totalGoogle = weeks.reduce((s, w) => s + w.google, 0);
  const totalMeta = weeks.reduce((s, w) => s + w.meta, 0);

  // ---- Audit score ----
  const latestAudit = auditReports[0] || null;

  const now = new Date();
  const generatedAt = now.toLocaleString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata",
  });

  // ---- Build HTML ----
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>ManagedAd Report — ${rangeLabel}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #fff; color: #1a1a1a; line-height: 1.5; padding: 40px; max-width: 900px; margin: 0 auto; }
  @media print {
    body { padding: 20px; }
    .no-print { display: none !important; }
    table { page-break-inside: auto; }
    tr { page-break-inside: avoid; }
  }

  .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px; border-bottom: 3px solid #f97316; padding-bottom: 20px; }
  .logo { font-size: 24px; font-weight: 800; color: #f97316; letter-spacing: -0.5px; }
  .logo span { color: #1a1a1a; }
  .header-right { text-align: right; font-size: 13px; color: #666; }
  .range-badge { display: inline-block; background: #f97316; color: #fff; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 4px; margin-bottom: 4px; }

  h2 { font-size: 16px; font-weight: 700; color: #1a1a1a; margin: 28px 0 14px; padding-bottom: 6px; border-bottom: 1px solid #e5e5e5; }

  .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 8px; }
  .kpi { border: 1px solid #e5e5e5; border-radius: 8px; padding: 16px; }
  .kpi-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #999; margin-bottom: 4px; }
  .kpi-value { font-size: 22px; font-weight: 800; color: #1a1a1a; }
  .kpi-sub { font-size: 11px; color: #888; margin-top: 2px; }

  .platform-bar { display: flex; height: 24px; border-radius: 6px; overflow: hidden; margin: 8px 0 6px; }
  .platform-bar div { display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; color: #fff; }
  .platform-legend { display: flex; gap: 16px; font-size: 12px; color: #666; }
  .platform-legend span { display: flex; align-items: center; gap: 4px; }
  .dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }

  table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 8px; }
  thead th { background: #f8f8f8; text-align: right; padding: 8px 12px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #888; border-bottom: 2px solid #e5e5e5; }
  thead th:first-child { text-align: left; }
  tbody td { padding: 8px 12px; text-align: right; color: #444; border-bottom: 1px solid #f0f0f0; }
  tbody td:first-child { text-align: left; color: #1a1a1a; font-weight: 500; }
  tbody tr:hover { background: #fef6ee; }

  .roas-good { color: #059669; font-weight: 600; }
  .roas-ok { color: #d97706; font-weight: 600; }
  .roas-bad { color: #dc2626; font-weight: 600; }

  .audit-box { border: 1px solid #e5e5e5; border-radius: 8px; padding: 16px; display: flex; align-items: center; gap: 16px; }
  .audit-score { width: 56px; height: 56px; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; font-weight: 800; font-size: 20px; color: #fff; }
  .audit-meta { font-size: 12px; color: #888; margin-top: 4px; }

  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e5e5; font-size: 11px; color: #aaa; text-align: center; }
  .print-btn { background: #f97316; color: #fff; border: none; padding: 10px 24px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; margin-bottom: 24px; }
  .print-btn:hover { background: #ea580c; }
</style>
</head>
<body>

<div class="no-print" style="text-align: center;">
  <button class="print-btn" onclick="window.print()">Save as PDF / Print</button>
</div>

<div class="header">
  <div>
    <div class="logo">Managed<span>Ad</span></div>
    <div style="font-size: 13px; color: #666; margin-top: 2px;">Performance Report</div>
  </div>
  <div class="header-right">
    <div class="range-badge">${rangeLabel}</div>
    <div style="margin-top: 4px;">${session.user.name || session.user.email || "Account"}</div>
    <div>Generated ${generatedAt} IST</div>
  </div>
</div>

<h2>Key Performance Indicators</h2>
<div class="kpi-grid">
  <div class="kpi">
    <div class="kpi-label">Total Spend</div>
    <div class="kpi-value">${formatINR(totalSpend)}</div>
    <div class="kpi-sub">${weeks.length} weeks</div>
  </div>
  <div class="kpi">
    <div class="kpi-label">Total Revenue</div>
    <div class="kpi-value">${formatINR(totalRevenue)}</div>
    <div class="kpi-sub">Tracked revenue</div>
  </div>
  <div class="kpi">
    <div class="kpi-label">Overall ROAS</div>
    <div class="kpi-value">${overallRoas}x</div>
    <div class="kpi-sub">Return on ad spend</div>
  </div>
  <div class="kpi">
    <div class="kpi-label">Conversions</div>
    <div class="kpi-value">${totalConversions.toLocaleString("en-IN")}</div>
    <div class="kpi-sub">${formatINR(overallCPA)} avg CPA</div>
  </div>
  <div class="kpi">
    <div class="kpi-label">Total Clicks</div>
    <div class="kpi-value">${totalClicks.toLocaleString("en-IN")}</div>
    <div class="kpi-sub">${overallCTR}% CTR</div>
  </div>
  <div class="kpi">
    <div class="kpi-label">Impressions</div>
    <div class="kpi-value">${totalImpressions.toLocaleString("en-IN")}</div>
    <div class="kpi-sub">All platforms</div>
  </div>
</div>

<h2>Platform Comparison</h2>
<div class="platform-bar">
  ${totalGoogle + totalMeta > 0 ? `
  <div style="width: ${((totalGoogle / (totalGoogle + totalMeta)) * 100).toFixed(1)}%; background: #f97316;">Google</div>
  <div style="width: ${((totalMeta / (totalGoogle + totalMeta)) * 100).toFixed(1)}%; background: #1877F2;">Meta</div>
  ` : `<div style="width:100%; background:#e5e5e5; color:#999;">No data</div>`}
</div>
<div class="platform-legend">
  <span><span class="dot" style="background: #f97316;"></span> Google Ads: ${formatINR(totalGoogle)}</span>
  <span><span class="dot" style="background: #1877F2;"></span> Meta Ads: ${formatINR(totalMeta)}</span>
</div>

<h2>Weekly Breakdown</h2>
<table>
  <thead>
    <tr>
      <th>Week of</th>
      <th>Spend</th>
      <th>Revenue</th>
      <th>ROAS</th>
      <th>Clicks</th>
      <th>Conv.</th>
      <th>CPA</th>
      <th>CTR</th>
      <th>Google</th>
      <th>Meta</th>
    </tr>
  </thead>
  <tbody>
    ${weeks.map((w) => {
      const roasClass = w.roas >= 2 ? "roas-good" : w.roas >= 1 ? "roas-ok" : "roas-bad";
      return `<tr>
        <td>${w.weekLabel}</td>
        <td>${formatINR(w.spend)}</td>
        <td>${formatINR(w.revenue)}</td>
        <td class="${roasClass}">${w.roas.toFixed(2)}x</td>
        <td>${w.clicks.toLocaleString("en-IN")}</td>
        <td>${w.conversions}</td>
        <td>${w.cpa > 0 ? formatINR(w.cpa) : "—"}</td>
        <td>${w.ctr.toFixed(2)}%</td>
        <td>${formatINR(w.google)}</td>
        <td>${formatINR(w.meta)}</td>
      </tr>`;
    }).join("\n    ")}
  </tbody>
</table>

<h2>Top Campaigns</h2>
<table>
  <thead>
    <tr>
      <th>Campaign</th>
      <th>Platform</th>
      <th>Status</th>
      <th>Spend</th>
      <th>Revenue</th>
      <th>ROAS</th>
      <th>Clicks</th>
      <th>Conv.</th>
    </tr>
  </thead>
  <tbody>
    ${topCampaigns.map((c) => {
      const s = Number(c.spend);
      const r = Number(c.revenue);
      const roas = s > 0 ? (r / s).toFixed(2) : "0.00";
      const roasClass = parseFloat(roas) >= 2 ? "roas-good" : parseFloat(roas) >= 1 ? "roas-ok" : "roas-bad";
      return `<tr>
        <td>${c.name}</td>
        <td>${c.platform === "GOOGLE_ADS" ? "Google" : "Meta"}</td>
        <td>${c.status}</td>
        <td>${formatINR(s)}</td>
        <td>${formatINR(r)}</td>
        <td class="${roasClass}">${roas}x</td>
        <td>${Number(c.clicks).toLocaleString("en-IN")}</td>
        <td>${c.conversions}</td>
      </tr>`;
    }).join("\n    ")}
  </tbody>
</table>

${latestAudit ? `
<h2>Account Health Score</h2>
<div class="audit-box">
  <div class="audit-score" style="background: ${latestAudit.score >= 80 ? "#059669" : latestAudit.score >= 60 ? "#d97706" : "#dc2626"};">
    ${latestAudit.score}
    <span style="font-size: 10px; font-weight: 500;">/100</span>
  </div>
  <div>
    <div style="font-size: 14px; font-weight: 600;">Latest Audit Score: ${latestAudit.score}/100</div>
    ${latestAudit.summary ? `<div style="font-size: 12px; color: #666; margin-top: 4px;">${latestAudit.summary}</div>` : ""}
    <div class="audit-meta">${new Date(latestAudit.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</div>
  </div>
</div>
` : ""}

<div class="footer">
  ManagedAd — Autonomous AI Ad Management &bull; Report generated on ${generatedAt} IST &bull; managedad.com
</div>

</body>
</html>`;

  const filename = `ManagedAd-Report-${range}.html`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
