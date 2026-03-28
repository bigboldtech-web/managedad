// Click fraud scoring engine
// Signals: click velocity, bot UA patterns, known datacenter ranges, VPN/proxy heuristics

export interface ClickSignal {
  ip: string;
  userAgent: string;
  referer?: string;
  country?: string;
  campaignTargetCountries?: string[];
}

export interface FraudScore {
  score: number; // 0–1
  reasons: string[];
  isBot: boolean;
  isFraud: boolean;
}

// Known bot/headless browser UA fragments
const BOT_UA_PATTERNS = [
  "headlesschrome",
  "phantomjs",
  "selenium",
  "puppeteer",
  "playwright",
  "webdriver",
  "bot",
  "crawler",
  "spider",
  "scraper",
  "curl/",
  "wget/",
  "python-requests",
  "go-http-client",
  "java/",
  "okhttp",
];

// Known datacenter/VPN CIDR prefixes (first 2 octets)
const DATACENTER_PREFIXES = [
  "185.220", // Tor exit nodes
  "198.23",  // Various VPS
  "176.10",  // Privacy VPN
  "45.76",   // Vultr
  "103.21",  // Cloudflare but often abused
  "162.243", // DigitalOcean
  "91.108",  // Telegram / data center
  "167.99",  // DigitalOcean
  "134.209", // DigitalOcean
  "68.183",  // DigitalOcean
  "159.65",  // DigitalOcean
  "165.232", // DigitalOcean
];

export function scoreFraud(signal: ClickSignal, recentClicksFromIp: number): FraudScore {
  const reasons: string[] = [];
  let score = 0;

  const ua = (signal.userAgent || "").toLowerCase();

  // 1. Bot user-agent check
  const botMatch = BOT_UA_PATTERNS.find((p) => ua.includes(p));
  if (botMatch) {
    reasons.push(`Bot user agent detected (${botMatch})`);
    score += 0.55;
  } else if (!signal.userAgent || signal.userAgent.length < 20) {
    reasons.push("Missing or very short user agent");
    score += 0.3;
  }

  // 2. Click velocity (per IP in last hour)
  if (recentClicksFromIp >= 10) {
    reasons.push(`Click velocity: ${recentClicksFromIp} clicks/hr from this IP`);
    score += 0.4;
  } else if (recentClicksFromIp >= 5) {
    reasons.push(`Elevated click rate: ${recentClicksFromIp} clicks/hr`);
    score += 0.2;
  }

  // 3. Known datacenter IP
  const prefix = signal.ip.split(".").slice(0, 2).join(".");
  if (DATACENTER_PREFIXES.includes(prefix)) {
    reasons.push("Known datacenter/VPN IP range");
    score += 0.3;
  }

  // 4. Geographic mismatch
  if (
    signal.country &&
    signal.campaignTargetCountries &&
    signal.campaignTargetCountries.length > 0 &&
    !signal.campaignTargetCountries.includes(signal.country)
  ) {
    reasons.push(`Geographic mismatch: click from ${signal.country}, campaign targets ${signal.campaignTargetCountries.join(", ")}`);
    score += 0.25;
  }

  // 5. No referer on paid click (suspicious)
  if (!signal.referer || signal.referer.trim() === "") {
    score += 0.05;
  }

  // Cap at 1.0
  score = Math.min(score, 1.0);

  return {
    score,
    reasons,
    isBot: BOT_UA_PATTERNS.some((p) => ua.includes(p)),
    isFraud: score >= 0.6,
  };
}
