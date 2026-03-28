#!/usr/bin/env python3
"""Generate ManagedAd Google Ads API Design Document PDF."""

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor, black, white
from reportlab.lib.units import inch, mm
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable, KeepTogether,
)
from reportlab.pdfgen import canvas
import os

OUTPUT = os.path.join(os.path.dirname(__file__), "ManagedAd-API-Design-Document.pdf")

# Colors
ORANGE = HexColor("#f97316")
DARK_BG = HexColor("#111114")
DARK_BORDER = HexColor("#27272e")
GREY = HexColor("#71717a")
LIGHT = HexColor("#fafafa")
WHITE = HexColor("#ffffff")
BLUE = HexColor("#4285F4")

# Styles
styles = getSampleStyleSheet()

styles.add(ParagraphStyle(
    "DocTitle", parent=styles["Title"], fontSize=28, leading=34,
    textColor=HexColor("#1a1a1a"), spaceAfter=6, fontName="Helvetica-Bold",
))
styles.add(ParagraphStyle(
    "DocSubtitle", parent=styles["Normal"], fontSize=14, leading=18,
    textColor=GREY, spaceAfter=20, fontName="Helvetica",
))
styles.add(ParagraphStyle(
    "SectionHead", parent=styles["Heading1"], fontSize=18, leading=22,
    textColor=HexColor("#1a1a1a"), spaceBefore=24, spaceAfter=10,
    fontName="Helvetica-Bold",
))
styles.add(ParagraphStyle(
    "SubHead", parent=styles["Heading2"], fontSize=14, leading=18,
    textColor=HexColor("#333333"), spaceBefore=16, spaceAfter=8,
    fontName="Helvetica-Bold",
))
styles.add(ParagraphStyle(
    "Body", parent=styles["Normal"], fontSize=10.5, leading=15,
    textColor=HexColor("#333333"), spaceAfter=8, fontName="Helvetica",
    alignment=TA_JUSTIFY,
))
styles.add(ParagraphStyle(
    "BulletItem", parent=styles["Normal"], fontSize=10.5, leading=15,
    textColor=HexColor("#333333"), spaceAfter=4, fontName="Helvetica",
    leftIndent=20, bulletIndent=10, bulletFontName="Helvetica", bulletFontSize=10,
))
styles.add(ParagraphStyle(
    "SmallGrey", parent=styles["Normal"], fontSize=9, leading=12,
    textColor=GREY, fontName="Helvetica",
))
styles.add(ParagraphStyle(
    "TableCell", parent=styles["Normal"], fontSize=9.5, leading=13,
    textColor=HexColor("#333333"), fontName="Helvetica",
))
styles.add(ParagraphStyle(
    "TableHead", parent=styles["Normal"], fontSize=9.5, leading=13,
    textColor=WHITE, fontName="Helvetica-Bold",
))
styles.add(ParagraphStyle(
    "TOCEntry", parent=styles["Normal"], fontSize=11, leading=18,
    textColor=HexColor("#333333"), fontName="Helvetica",
))

def orange_hr():
    return HRFlowable(width="100%", thickness=2, color=ORANGE, spaceAfter=12, spaceBefore=4)

def grey_hr():
    return HRFlowable(width="100%", thickness=0.5, color=HexColor("#e0e0e0"), spaceAfter=10, spaceBefore=6)

def make_table(headers, rows, col_widths=None):
    """Create a styled table."""
    header_row = [Paragraph(h, styles["TableHead"]) for h in headers]
    data = [header_row]
    for row in rows:
        data.append([Paragraph(str(cell), styles["TableCell"]) for cell in row])

    w = col_widths or [None] * len(headers)
    t = Table(data, colWidths=w, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), HexColor("#1a1a1a")),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9.5),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
        ("TOPPADDING", (0, 0), (-1, 0), 8),
        ("BACKGROUND", (0, 1), (-1, -1), WHITE),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, HexColor("#f9f9f9")]),
        ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#e0e0e0")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 1), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 6),
    ]))
    return t

def build_pdf():
    doc = SimpleDocTemplate(
        OUTPUT, pagesize=A4,
        leftMargin=1*inch, rightMargin=1*inch,
        topMargin=0.8*inch, bottomMargin=0.8*inch,
        title="ManagedAd - Google Ads API Design Document",
        author="ManagedAd (Big Bold Technologies)",
    )

    story = []

    # ==================== COVER PAGE ====================
    story.append(Spacer(1, 1.5*inch))
    story.append(Paragraph("ManagedAd", styles["DocTitle"]))
    story.append(Paragraph(
        '<font color="#f97316">Google Ads API Design Document</font>',
        ParagraphStyle("OrangeTitle", parent=styles["DocTitle"], fontSize=22, leading=28, textColor=ORANGE),
    ))
    story.append(Spacer(1, 8))
    story.append(Paragraph("Basic Access Application", styles["DocSubtitle"]))
    story.append(orange_hr())
    story.append(Spacer(1, 20))

    cover_info = [
        ("Company", "Big Bold Technologies (ManagedAd)"),
        ("Website", "https://managedad.com"),
        ("Contact", "ibrahimnsurya@gmail.com"),
        ("MCC ID", "605-644-5342"),
        ("Document Version", "1.0"),
        ("Date", "March 2026"),
        ("Company Type", "SaaS Platform (Advertiser Tool)"),
        ("Principal Place of Business", "India"),
    ]
    for label, value in cover_info:
        story.append(Paragraph(
            f'<b>{label}:</b>  {value}', styles["Body"]
        ))

    story.append(PageBreak())

    # ==================== TABLE OF CONTENTS ====================
    story.append(Paragraph("Table of Contents", styles["SectionHead"]))
    story.append(orange_hr())
    toc_items = [
        "1. Executive Summary",
        "2. Product Overview",
        "3. Google Ads API Usage",
        "4. API Endpoints and Operations",
        "5. Data Flow Architecture",
        "6. Authentication and Security",
        "7. Rate Limiting and Compliance",
        "8. User Interface Screenshots",
        "9. Automation Schedule",
        "10. Data Handling and Privacy",
    ]
    for item in toc_items:
        story.append(Paragraph(item, styles["TOCEntry"]))
    story.append(PageBreak())

    # ==================== 1. EXECUTIVE SUMMARY ====================
    story.append(Paragraph("1. Executive Summary", styles["SectionHead"]))
    story.append(orange_hr())
    story.append(Paragraph(
        "ManagedAd is an AI-powered performance marketing SaaS platform built by Big Bold Technologies. "
        "It helps advertisers monitor, optimize, and automate their Google Ads and Meta Ads campaigns "
        "through a unified dashboard. The platform replaces the need for a dedicated performance marketer "
        "by using artificial intelligence to make data-driven optimization decisions 24/7.",
        styles["Body"]
    ))
    story.append(Paragraph(
        "We are applying for <b>Basic Access</b> to the Google Ads API to enable our platform to:",
        styles["Body"]
    ))
    for item in [
        "Read campaign, ad group, ad, and keyword performance data for unified reporting",
        "Sync daily metrics for AI-powered analysis and anomaly detection",
        "Execute optimization actions: budget adjustments, bid modifications, keyword management",
        "Mine search terms and add negative keywords to reduce wasted ad spend",
        "Generate AI-powered ad copy and publish as drafts for advertiser review",
        "Detect click fraud and add IP exclusions to protect advertiser budgets",
        "Run weekly account audits with automated recommendations",
    ]:
        story.append(Paragraph(f"<bullet>&bull;</bullet> {item}", styles["BulletItem"]))

    story.append(Spacer(1, 8))
    story.append(Paragraph(
        "ManagedAd is designed for <b>external users</b> (advertisers and marketing agencies) who connect "
        "their own Google Ads accounts via OAuth 2.0. Each user manages their own campaigns through our platform.",
        styles["Body"]
    ))
    story.append(PageBreak())

    # ==================== 2. PRODUCT OVERVIEW ====================
    story.append(Paragraph("2. Product Overview", styles["SectionHead"]))
    story.append(orange_hr())

    story.append(Paragraph("2.1 What ManagedAd Does", styles["SubHead"]))
    story.append(Paragraph(
        "ManagedAd is an autonomous AI ad management platform. After a user connects their Google Ads account, "
        "the system follows a continuous optimization loop:",
        styles["Body"]
    ))
    story.append(Paragraph(
        "<b>CONNECT &rarr; SYNC &rarr; ANALYZE &rarr; DECIDE &rarr; EXECUTE &rarr; LOG &rarr; REPORT &rarr; REPEAT</b>",
        ParagraphStyle("LoopStyle", parent=styles["Body"], fontSize=11, textColor=ORANGE, alignment=TA_CENTER, spaceAfter=12),
    ))

    features = [
        ("Unified Dashboard", "Aggregates Google Ads and Meta Ads data into a single real-time dashboard with KPIs, charts, and campaign tables."),
        ("Negative Keyword Mining", "Pulls search term reports, identifies wasteful terms using AI, and adds negative keywords automatically."),
        ("Budget Optimization", "Analyzes 7-day rolling ROAS and reallocates budget from underperforming to high-performing campaigns (max 20% shift per iteration)."),
        ("Click Fraud Detection", "Detects fraudulent clicks via IP analysis, bot detection, and geo-mismatch checks. Adds IPs to Google Ads exclusion lists."),
        ("AI Creative Generation", "Generates Google Responsive Search Ad (RSA) headlines and descriptions using AI, then publishes as drafts."),
        ("Weekly Account Audit", "Runs 7 automated checks (waste, keywords, tracking, structure, bidding, geo, device) and generates a health score."),
        ("AI Chat Interface", "Natural language interface where users can ask questions about their campaign performance and receive data-driven answers."),
        ("Automated Reporting", "Daily digest, weekly, and monthly performance reports sent via email."),
        ("Competitor Intelligence", "Pulls Google Ads Auction Insights to show competitor overlap, impression share, and position data."),
        ("Bid Adjustments", "Analyzes performance by device, location, and time-of-day to set optimal bid modifiers."),
    ]

    story.append(make_table(
        ["Feature", "Description"],
        features,
        col_widths=[1.8*inch, 4.5*inch],
    ))

    story.append(Spacer(1, 12))
    story.append(Paragraph("2.2 Pricing Plans", styles["SubHead"]))
    plans = [
        ("Starter", "2,999/mo", "2 ad accounts, 25 campaigns, basic automations"),
        ("Growth", "7,999/mo", "4 ad accounts, unlimited campaigns, AI chat, fraud detection, competitor intel"),
        ("Agency", "19,999/mo", "Unlimited accounts, cross-platform reallocation, white-label reports, API access"),
    ]
    story.append(make_table(
        ["Plan", "Price (INR)", "Includes"],
        plans,
        col_widths=[1.2*inch, 1.5*inch, 3.6*inch],
    ))
    story.append(Paragraph("All plans include a 14-day free trial. Annual plans available at 20% discount.", styles["SmallGrey"]))

    story.append(PageBreak())

    # ==================== 3. GOOGLE ADS API USAGE ====================
    story.append(Paragraph("3. Google Ads API Usage", styles["SectionHead"]))
    story.append(orange_hr())

    story.append(Paragraph("3.1 API Version", styles["SubHead"]))
    story.append(Paragraph("ManagedAd uses <b>Google Ads API v19</b> (REST + GAQL).", styles["Body"]))

    story.append(Paragraph("3.2 Authentication Flow", styles["SubHead"]))
    story.append(Paragraph(
        "ManagedAd uses the standard <b>OAuth 2.0 Authorization Code flow</b> to obtain access to a user's "
        "Google Ads account. The flow is as follows:",
        styles["Body"]
    ))
    auth_steps = [
        ("1", "User clicks 'Connect Google Ads' in ManagedAd settings page"),
        ("2", "User is redirected to Google's OAuth consent screen with required scopes"),
        ("3", "User grants permission; Google redirects back with an authorization code"),
        ("4", "ManagedAd exchanges the code for access_token and refresh_token server-side"),
        ("5", "Tokens are encrypted using AES-256-GCM and stored in our database"),
        ("6", "ManagedAd calls the ListAccessibleCustomers endpoint to discover available accounts"),
        ("7", "User selects which Google Ads account(s) to connect"),
        ("8", "Data sync begins automatically for the connected account(s)"),
    ]
    story.append(make_table(
        ["Step", "Description"],
        auth_steps,
        col_widths=[0.5*inch, 5.8*inch],
    ))

    story.append(Spacer(1, 8))
    story.append(Paragraph("3.3 OAuth Scopes Requested", styles["SubHead"]))
    story.append(Paragraph("<b>https://www.googleapis.com/auth/adwords</b> - This is the only scope requested. "
        "It provides read and write access to the user's Google Ads account, which is required for "
        "campaign management, reporting, and optimization.", styles["Body"]))

    story.append(Paragraph("3.4 Token Management", styles["SubHead"]))
    for item in [
        "Access tokens are refreshed automatically before expiry using the refresh token",
        "All tokens are encrypted at rest using AES-256-GCM with a server-side encryption key",
        "Tokens are only decrypted in memory when making API calls, never logged or exposed",
        "Users can disconnect their account at any time, which revokes and deletes all stored tokens",
        "Token refresh failures mark the connection as inactive and notify the user to reconnect",
    ]:
        story.append(Paragraph(f"<bullet>&bull;</bullet> {item}", styles["BulletItem"]))

    story.append(PageBreak())

    # ==================== 4. API ENDPOINTS ====================
    story.append(Paragraph("4. API Endpoints and Operations", styles["SectionHead"]))
    story.append(orange_hr())

    story.append(Paragraph("4.1 Read Operations (Reporting)", styles["SubHead"]))
    read_ops = [
        ("Campaign data", "googleAds:search (GAQL)", "Campaign performance, budget, status, bidding strategy", "Every 1 hour"),
        ("Ad Group data", "googleAds:search (GAQL)", "Ad group metrics, bids, status", "Every 1 hour"),
        ("Keyword data", "keyword_view (GAQL)", "Keyword text, match type, quality score, metrics", "Every 1 hour"),
        ("Ad data", "googleAds:search (GAQL)", "Ad headlines, descriptions, status, metrics", "Every 1 hour"),
        ("Search Terms", "search_term_view (GAQL)", "User search queries triggering ads, with click/conversion data", "Every 6 hours"),
        ("Daily Metrics", "campaign (GAQL)", "Daily spend, impressions, clicks, conversions, revenue by campaign", "Every 1 hour"),
        ("Auction Insights", "auction_insight (GAQL)", "Competitor domains, impression share, overlap rate", "Daily"),
        ("Accessible Customers", "listAccessibleCustomers", "List of Google Ads accounts user has access to", "On connect"),
        ("Customer Details", "customers/{id}", "Account name, currency, timezone for connected accounts", "On connect"),
    ]
    story.append(make_table(
        ["Data", "API Resource", "Fields Retrieved", "Frequency"],
        read_ops,
        col_widths=[1.2*inch, 1.5*inch, 2.2*inch, 1.1*inch],
    ))

    story.append(Spacer(1, 12))
    story.append(Paragraph("4.2 Write Operations (Mutations)", styles["SubHead"]))
    write_ops = [
        ("Add Negative Keywords", "campaignCriterionOperation", "Adds wasteful search terms as campaign-level negative keywords", "Every 6 hours"),
        ("Adjust Campaign Budget", "campaignBudgetOperation", "Increases/decreases daily budget based on ROAS performance (max 20% change)", "Hourly"),
        ("Pause/Enable Ads", "adGroupAdOperation", "Pauses low-CTR ads, re-enables improved ads", "Daily"),
        ("Pause Keywords", "adGroupCriterionOperation", "Pauses keywords with high spend and zero conversions", "Daily"),
        ("Adjust Keyword Bids", "adGroupCriterionOperation", "Modifies CPC bids based on CPA analysis", "Every 4 hours"),
        ("Create RSA Drafts", "adGroupAdOperation", "Creates AI-generated Responsive Search Ads as PAUSED drafts", "On demand"),
        ("IP Exclusions", "campaignCriterionOperation", "Blocks fraudulent IPs detected by fraud detection system", "Real-time"),
        ("Create Campaigns", "campaignOperation + campaignBudgetOperation", "Creates new campaigns via the campaign wizard", "On demand"),
        ("Remove Keywords", "adGroupCriterionOperation (remove)", "Removes keywords via the keyword manager", "On demand"),
    ]
    story.append(make_table(
        ["Action", "API Operation", "Description", "Frequency"],
        write_ops,
        col_widths=[1.3*inch, 1.6*inch, 2.1*inch, 1*inch],
    ))

    story.append(Spacer(1, 8))
    story.append(Paragraph(
        "<b>Important:</b> All write operations are logged in our AutomationLog with before/after values. "
        "Every automated change can be rolled back by the user with a single click from the Automations page.",
        styles["Body"]
    ))

    story.append(PageBreak())

    # ==================== 4.3 GAQL QUERIES ====================
    story.append(Paragraph("4.3 Sample GAQL Queries", styles["SubHead"]))

    queries = [
        ("Campaign Sync",
         "SELECT campaign.id, campaign.name, campaign.status, campaign_budget.amount_micros, "
         "metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions, "
         "metrics.conversions_value FROM campaign WHERE campaign.status != 'REMOVED' "
         "ORDER BY metrics.cost_micros DESC"),
        ("Search Term Mining",
         "SELECT search_term_view.search_term, metrics.clicks, metrics.conversions, "
         "metrics.cost_micros, campaign.id FROM search_term_view WHERE segments.date "
         "DURING LAST_30_DAYS AND metrics.cost_micros > 20000000 AND metrics.conversions = 0"),
        ("Keyword Performance",
         "SELECT ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type, "
         "ad_group_criterion.quality_info.quality_score, metrics.impressions, metrics.clicks, "
         "metrics.cost_micros, metrics.conversions FROM keyword_view WHERE "
         "ad_group_criterion.status != 'REMOVED' ORDER BY metrics.cost_micros DESC"),
        ("Auction Insights",
         "SELECT auction_insight.domain, metrics.auction_insight_search_impression_share, "
         "metrics.auction_insight_search_overlap_rate, metrics.auction_insight_search_position_above_rate "
         "FROM campaign WHERE segments.date DURING LAST_30_DAYS AND campaign.status = 'ENABLED'"),
        ("Daily Performance Report",
         "SELECT segments.date, campaign.id, campaign.name, metrics.impressions, metrics.clicks, "
         "metrics.cost_micros, metrics.conversions, metrics.conversions_value FROM campaign "
         "WHERE segments.date BETWEEN '{start}' AND '{end}' AND campaign.status != 'REMOVED' "
         "ORDER BY segments.date ASC"),
    ]

    for name, query in queries:
        story.append(Paragraph(f"<b>{name}:</b>", styles["Body"]))
        story.append(Paragraph(
            f'<font face="Courier" size="8" color="#333333">{query}</font>',
            ParagraphStyle("Code", parent=styles["Body"], fontSize=8, leading=11,
                          fontName="Courier", leftIndent=12, spaceAfter=10,
                          backColor=HexColor("#f5f5f5")),
        ))

    story.append(PageBreak())

    # ==================== 5. DATA FLOW ====================
    story.append(Paragraph("5. Data Flow Architecture", styles["SectionHead"]))
    story.append(orange_hr())

    story.append(Paragraph("5.1 System Architecture", styles["SubHead"]))
    story.append(Paragraph(
        "ManagedAd follows a server-side architecture where all Google Ads API calls are made from our "
        "backend. No API calls are made from the user's browser. The architecture consists of:",
        styles["Body"]
    ))

    arch_components = [
        ("Next.js Frontend", "React-based dashboard with dark theme UI. Displays campaigns, metrics, charts, and settings."),
        ("Next.js API Routes", "Server-side API handlers for all operations. Handles OAuth callbacks, data queries, and mutations."),
        ("Prisma ORM + PostgreSQL", "Database layer storing user accounts, campaign data, daily metrics, automation logs, and encrypted tokens."),
        ("Vercel Cron Jobs", "10 scheduled jobs that trigger data sync, optimization, reporting, and monitoring at defined intervals."),
        ("Anthropic Claude API", "AI engine for search term analysis, creative generation, account auditing, and natural language chat."),
        ("Google Ads API v19", "Primary data source for campaign management. All read/write operations go through this API."),
        ("Meta Marketing API v22.0", "Secondary platform integration for Meta/Facebook ad campaigns."),
    ]
    story.append(make_table(
        ["Component", "Purpose"],
        arch_components,
        col_widths=[2*inch, 4.3*inch],
    ))

    story.append(Spacer(1, 12))
    story.append(Paragraph("5.2 Data Sync Flow", styles["SubHead"]))
    story.append(Paragraph(
        "Every hour, the data sync cron job executes the following sequence for each connected Google Ads account:",
        styles["Body"]
    ))
    sync_steps = [
        "1. Retrieve encrypted tokens from database and decrypt in memory",
        "2. Fetch all campaigns via GAQL (status, budget, metrics)",
        "3. Upsert campaigns into local database using externalId for deduplication",
        "4. Fetch ad groups for each campaign and upsert",
        "5. Fetch keywords across all ad groups and upsert with quality scores",
        "6. Fetch daily performance metrics for the last 7 days and upsert",
        "7. Update campaign aggregate metrics (total spend, conversions, ROAS)",
        "8. Update connection's lastSyncAt timestamp",
    ]
    for step in sync_steps:
        story.append(Paragraph(step, styles["Body"]))

    story.append(Spacer(1, 8))
    story.append(Paragraph("5.3 Optimization Flow", styles["SubHead"]))
    story.append(Paragraph(
        "When the optimization engine runs (daily at 6 AM, or triggered manually by the user):",
        styles["Body"]
    ))
    opt_steps = [
        "1. Load all ACTIVE and PAUSED campaigns for the user",
        "2. Build a CampaignAnalysis object for each campaign (metrics, ads, keywords, 14-day trend)",
        "3. Run 8 deterministic optimization rules (pause low-CTR ads, adjust budgets, etc.)",
        "4. Send analyses to Claude AI for additional recommendations (non-blocking, fallback to rules-only)",
        "5. Deduplicate AI suggestions against rule outputs",
        "6. Store all actions in OptimizationAction table with status PENDING or APPROVED",
        "7. If auto-apply is enabled, execute APPROVED actions via Google Ads API immediately",
        "8. Update action status to APPLIED (success) or FAILED (error)",
        "9. Send notification summary via email, Slack, or WhatsApp based on user preferences",
    ]
    for step in opt_steps:
        story.append(Paragraph(step, styles["Body"]))

    story.append(PageBreak())

    # ==================== 6. SECURITY ====================
    story.append(Paragraph("6. Authentication and Security", styles["SectionHead"]))
    story.append(orange_hr())

    security_items = [
        ("Token Encryption", "All OAuth tokens (access_token, refresh_token) are encrypted at rest using AES-256-GCM. "
         "The encryption key is stored as an environment variable, never in code. Tokens are decrypted only in memory when making API calls."),
        ("Row-Level Security", "Every database query is filtered by userId. Users can only access data from their own connected accounts. "
         "API routes verify session authentication before any data access."),
        ("OAuth CSRF Protection", "OAuth callbacks validate a state parameter against an HttpOnly cookie to prevent cross-site request forgery attacks."),
        ("Rate Limiting", "All authentication endpoints (login, register, password reset) are rate-limited to prevent brute force attacks. "
         "API endpoints are limited to 100 requests/minute per user."),
        ("Token Refresh", "Access tokens are automatically refreshed when they expire (401 response). Refresh failures mark the connection "
         "as inactive and notify the user. Meta tokens are proactively refreshed before their 60-day expiry."),
        ("Data Isolation", "Each organization's data is completely isolated. No campaign data is shared between users. "
         "Prisma queries enforce userId filtering on every operation."),
        ("Environment Validation", "Required environment variables are validated at startup. The application fails fast in production "
         "if critical variables (DATABASE_URL, NEXTAUTH_SECRET) are missing."),
        ("Password Security", "User passwords are hashed with bcryptjs (salt rounds: 12). Email verification is required. "
         "Password reset uses SHA-256 hashed tokens with 1-hour expiry."),
    ]

    story.append(make_table(
        ["Security Measure", "Implementation"],
        security_items,
        col_widths=[1.5*inch, 4.8*inch],
    ))

    story.append(PageBreak())

    # ==================== 7. RATE LIMITING ====================
    story.append(Paragraph("7. Rate Limiting and Compliance", styles["SectionHead"]))
    story.append(orange_hr())

    story.append(Paragraph("7.1 Google Ads API Rate Limits", styles["SubHead"]))
    story.append(Paragraph(
        "ManagedAd is designed to operate well within Google Ads API rate limits:",
        styles["Body"]
    ))
    rate_items = [
        "Basic Access allows 15,000 operations per day - our usage pattern stays well under this limit",
        "Mutate operations are batched where possible to minimize API calls",
        "Data sync runs hourly with efficient GAQL queries that fetch all needed data in minimal requests",
        "Search term mining runs every 6 hours (4 times/day) with a single aggregated query",
        "Budget changes are capped at 20% per iteration to prevent aggressive optimization",
        "All API calls include proper error handling with exponential backoff on rate limit responses (429/RESOURCE_EXHAUSTED)",
        "Token refresh is handled gracefully on 401 responses without redundant retries",
    ]
    for item in rate_items:
        story.append(Paragraph(f"<bullet>&bull;</bullet> {item}", styles["BulletItem"]))

    story.append(Spacer(1, 8))
    story.append(Paragraph("7.2 Estimated Daily API Usage (per connected account)", styles["SubHead"]))
    usage_table = [
        ("Campaign sync (GAQL search)", "24/day", "~24 read operations"),
        ("Ad group sync", "24/day", "~120 read operations (5 campaigns avg)"),
        ("Keyword sync", "24/day", "~24 read operations"),
        ("Daily metrics sync", "24/day", "~24 read operations"),
        ("Search term mining", "4/day", "~4 read operations"),
        ("Budget optimization", "24/day", "~48 read + write operations"),
        ("Negative keyword additions", "4/day", "~8 write operations"),
        ("Auction insights", "1/day", "~1 read operation"),
        ("", "<b>Total estimate</b>", "<b>~253 operations/day/account</b>"),
    ]
    story.append(make_table(
        ["Operation", "Frequency", "Est. API Calls"],
        usage_table,
        col_widths=[2.2*inch, 1.3*inch, 2.8*inch],
    ))
    story.append(Paragraph(
        "With Basic Access (15,000 ops/day), ManagedAd can comfortably serve ~50 connected Google Ads accounts.",
        styles["SmallGrey"]
    ))

    story.append(Spacer(1, 8))
    story.append(Paragraph("7.3 Compliance", styles["SubHead"]))
    compliance_items = [
        "ManagedAd complies with the Google Ads API Terms of Service",
        "We do not cache or store Google Ads data beyond what is necessary for our optimization features",
        "Users must explicitly grant OAuth consent before any data access",
        "Users can disconnect their account at any time, which deletes all stored tokens and stops all API access",
        "We do not share any Google Ads data between users or with third parties",
        "All data access is logged and auditable",
        "We display clear attribution that data comes from Google Ads in our dashboard",
    ]
    for item in compliance_items:
        story.append(Paragraph(f"<bullet>&bull;</bullet> {item}", styles["BulletItem"]))

    story.append(PageBreak())

    # ==================== 8. UI SCREENSHOTS ====================
    story.append(Paragraph("8. User Interface Description", styles["SectionHead"]))
    story.append(orange_hr())
    story.append(Paragraph(
        "ManagedAd features a dark-themed dashboard (background: #09090b) with an orange accent (#f97316). "
        "Below are descriptions of the key screens that interact with Google Ads API data:",
        styles["Body"]
    ))

    screens = [
        ("Dashboard (/dashboard)", "Main overview showing 6 KPI cards (Total Spend, Impressions, Clicks, Conversions, "
         "CTR, ROAS), a spend-over-time line chart broken down by platform (Google vs Meta), a pie chart for "
         "platform spend distribution, and a top campaigns table sorted by ROAS."),
        ("Campaigns (/campaigns)", "Paginated table of all campaigns showing name, platform badge (Google/Meta), status, "
         "daily budget, impressions, clicks, conversions, spend, and ROAS. Supports sorting and filtering by platform."),
        ("Google Ads Keywords (/google-ads/keywords)", "Keyword manager showing keyword text, match type (color-coded badges), "
         "quality score, impressions, clicks, conversions, spend, and CPC. Includes add/delete functionality."),
        ("Automations (/automations)", "Log of all AI optimization actions with type filter (Negative Keyword, Budget, "
         "Bid, Creative, Pause/Enable), status badges, impact estimates, and rollback buttons for applied actions."),
        ("AI Chat (/chat)", "Conversational interface where users ask questions about their Google Ads performance. "
         "Responses stream in real-time and include inline action buttons (Increase Budget, Pause Ad, etc.)."),
        ("Creatives (/creatives)", "AI creative generation tool. User selects a campaign/ad group, clicks 'Generate', "
         "and receives 5 RSA variations with 15 headlines and 4 descriptions each. Preview and 'Push as Draft' button."),
        ("Fraud Detection (/fraud)", "Shows blocked IPs, fraud score, detection reasons, click trend chart, "
         "estimated savings, and signal breakdown (bot UA, click velocity, datacenter IPs, geo mismatch)."),
        ("Settings (/settings)", "Four tabs: Profile, Connections (Connect Google Ads / Meta Ads buttons with OAuth flow), "
         "Notifications (email/Slack/WhatsApp toggles), and Security (password change)."),
        ("Reports (/reports)", "Weekly performance breakdown with ROAS trend chart, platform spend comparison, "
         "detailed table, audit history panel, and downloadable HTML report."),
        ("Competitor Intelligence (/competitors)", "Auction Insights data showing competitor domains, impression share, "
         "overlap rate, position-above rate, and threat level badges."),
    ]
    story.append(make_table(
        ["Screen", "Description"],
        screens,
        col_widths=[1.8*inch, 4.5*inch],
    ))

    story.append(PageBreak())

    # ==================== 9. AUTOMATION SCHEDULE ====================
    story.append(Paragraph("9. Automation Schedule", styles["SectionHead"]))
    story.append(orange_hr())
    story.append(Paragraph(
        "ManagedAd runs 10 scheduled cron jobs that interact with the Google Ads API:",
        styles["Body"]
    ))

    cron_schedule = [
        ("Data Sync", "Every 1 hour", "Google + Meta", "All plans", "Syncs campaigns, ad groups, ads, keywords, daily metrics"),
        ("Anomaly Detection", "Every 30 min", "All", "All plans", "Compares metrics vs 7-day average, alerts on spend spikes/drops"),
        ("Budget Optimization", "Every 1 hour", "Google + Meta", "All plans", "Reallocates budget based on ROAS (max 20% shift)"),
        ("Negative Keyword Mining", "Every 6 hours", "Google", "All plans", "Mines search terms, AI-filters irrelevant terms, adds negatives"),
        ("General Optimization", "Daily 6 AM", "Google + Meta", "All plans", "Runs 8 optimization rules + AI advisor across all campaigns"),
        ("Daily Digest Email", "Daily 8 AM", "All", "All plans", "Sends performance summary email to users"),
        ("Weekly Audit", "Monday 7 AM", "All", "All plans", "Runs 7 account health checks, generates audit report"),
        ("Weekly Report Email", "Monday 9 AM", "All", "All plans", "Sends comprehensive weekly report email"),
        ("Monthly Report", "1st of month 7 AM", "All", "All plans", "Sends monthly performance report with MoM comparisons"),
        ("Meta Token Refresh", "Wednesday 3 AM", "Meta", "All plans", "Proactively refreshes Meta long-lived tokens"),
    ]
    story.append(make_table(
        ["Job", "Schedule", "Platform", "Plan", "Description"],
        cron_schedule,
        col_widths=[1.2*inch, 1*inch, 1*inch, 0.8*inch, 2.3*inch],
    ))

    story.append(PageBreak())

    # ==================== 10. DATA HANDLING ====================
    story.append(Paragraph("10. Data Handling and Privacy", styles["SectionHead"]))
    story.append(orange_hr())

    story.append(Paragraph("10.1 What Data We Store", styles["SubHead"]))
    data_stored = [
        ("Campaign metadata", "Name, status, budget, bidding strategy, platform, dates"),
        ("Ad group metadata", "Name, status, bid amount, targeting"),
        ("Keyword metadata", "Text, match type, quality score, status"),
        ("Ad metadata", "Headlines, descriptions, status, type"),
        ("Daily metrics", "Impressions, clicks, conversions, spend, revenue (aggregated per campaign per day)"),
        ("Automation logs", "Action type, before/after values, status, timestamp"),
        ("Encrypted OAuth tokens", "AES-256-GCM encrypted access_token and refresh_token"),
    ]
    story.append(make_table(
        ["Data Type", "Fields Stored"],
        data_stored,
        col_widths=[1.8*inch, 4.5*inch],
    ))

    story.append(Spacer(1, 8))
    story.append(Paragraph("10.2 What We Do NOT Store", styles["SubHead"]))
    no_store = [
        "End-user personal information (PII) of ad viewers/clickers",
        "Raw search queries from end users (only aggregated search term reports)",
        "Billing or payment information from Google Ads accounts",
        "Google account passwords or credentials (only OAuth tokens)",
        "Any data from accounts the user has not explicitly connected",
    ]
    for item in no_store:
        story.append(Paragraph(f"<bullet>&bull;</bullet> {item}", styles["BulletItem"]))

    story.append(Spacer(1, 8))
    story.append(Paragraph("10.3 Data Deletion", styles["SubHead"]))
    story.append(Paragraph(
        "When a user disconnects their Google Ads account or deletes their ManagedAd account, "
        "all associated data is permanently deleted from our database, including:",
        styles["Body"]
    ))
    deletion_items = [
        "All encrypted OAuth tokens are immediately deleted",
        "All synced campaign, ad group, ad, and keyword data is cascade-deleted",
        "All daily metrics and automation logs are cascade-deleted",
        "All notification settings and preferences are deleted",
        "The deletion is irreversible and complete",
    ]
    for item in deletion_items:
        story.append(Paragraph(f"<bullet>&bull;</bullet> {item}", styles["BulletItem"]))

    story.append(Spacer(1, 30))
    story.append(grey_hr())
    story.append(Paragraph(
        "This document describes the complete design of ManagedAd's integration with the Google Ads API. "
        "For questions or additional information, please contact ibrahimnsurya@gmail.com.",
        styles["SmallGrey"]
    ))
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        "<b>ManagedAd</b> by Big Bold Technologies | https://managedad.com | March 2026",
        ParagraphStyle("Footer", parent=styles["SmallGrey"], alignment=TA_CENTER),
    ))

    # Build
    doc.build(story)
    print(f"PDF generated: {OUTPUT}")

if __name__ == "__main__":
    build_pdf()
