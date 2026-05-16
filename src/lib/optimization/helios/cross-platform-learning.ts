import { prisma } from "@/lib/prisma";
import type { AdPlatform } from "@prisma/client";

const MIN_IMPRESSIONS = 1000;
const TOP_PERCENTILE = 0.1;
const MIN_NGRAM_FREQ = 3;
const NGRAM_RANGE = [2, 3]; // bigrams + trigrams

interface ExtractedPattern {
  ngram: string;
  appearsIn: number;
  totalImpressions: number;
  weightedCtr: number;
  exampleAdId: string;
}

const STOPWORDS = new Set([
  "the", "a", "an", "of", "to", "for", "in", "on", "at", "with", "by", "is",
  "are", "was", "were", "be", "been", "have", "has", "had", "do", "does",
  "did", "and", "or", "but", "if", "then", "else", "your", "you", "we",
  "our", "us", "i", "my", "me", "this", "that", "these", "those",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t));
}

function extractNgrams(tokens: string[], n: number): string[] {
  const out: string[] = [];
  for (let i = 0; i <= tokens.length - n; i++) {
    out.push(tokens.slice(i, i + n).join(" "));
  }
  return out;
}

function collectAdText(headlines: unknown, descriptions: unknown, name: string | null): string {
  const parts: string[] = [];
  if (name) parts.push(name);
  if (Array.isArray(headlines)) {
    for (const h of headlines) if (typeof h === "string") parts.push(h);
  }
  if (Array.isArray(descriptions)) {
    for (const d of descriptions) if (typeof d === "string") parts.push(d);
  }
  return parts.join(" ");
}

export async function extractTopPatterns(
  userId: string,
  platform: AdPlatform
): Promise<ExtractedPattern[]> {
  const ads = await prisma.ad.findMany({
    where: {
      campaign: { userId, platform },
      status: "ACTIVE",
      impressions: { gt: MIN_IMPRESSIONS },
    },
  });

  if (ads.length < 5) return [];

  // Rank by CTR (clicks / impressions), take top percentile
  const ranked = ads
    .map((ad) => {
      const imp = Number(ad.impressions);
      const clk = Number(ad.clicks);
      return { ad, ctr: imp > 0 ? clk / imp : 0 };
    })
    .sort((a, b) => b.ctr - a.ctr);

  const topCount = Math.max(3, Math.floor(ranked.length * TOP_PERCENTILE));
  const top = ranked.slice(0, topCount);

  const ngramStats = new Map<
    string,
    { appearsIn: number; totalImpressions: number; weightedCtr: number; exampleAdId: string }
  >();

  for (const { ad, ctr } of top) {
    const text = collectAdText(ad.headlines, ad.descriptions, ad.name);
    const tokens = tokenize(text);
    const seenInThisAd = new Set<string>();
    for (const n of NGRAM_RANGE) {
      for (const ngram of extractNgrams(tokens, n)) {
        if (seenInThisAd.has(ngram)) continue;
        seenInThisAd.add(ngram);
        const prev = ngramStats.get(ngram) ?? {
          appearsIn: 0,
          totalImpressions: 0,
          weightedCtr: 0,
          exampleAdId: ad.id,
        };
        prev.appearsIn += 1;
        prev.totalImpressions += Number(ad.impressions);
        prev.weightedCtr += ctr * Number(ad.impressions);
        ngramStats.set(ngram, prev);
      }
    }
  }

  const results: ExtractedPattern[] = [];
  for (const [ngram, stats] of ngramStats) {
    if (stats.appearsIn < MIN_NGRAM_FREQ) continue;
    results.push({
      ngram,
      appearsIn: stats.appearsIn,
      totalImpressions: stats.totalImpressions,
      weightedCtr: stats.totalImpressions > 0 ? stats.weightedCtr / stats.totalImpressions : 0,
      exampleAdId: stats.exampleAdId,
    });
  }

  results.sort((a, b) => b.weightedCtr * b.totalImpressions - a.weightedCtr * a.totalImpressions);
  return results.slice(0, 10);
}

export async function generateInsights(userId: string): Promise<{
  created: number;
  patterns: { source: AdPlatform; target: AdPlatform; ngram: string }[];
}> {
  const directions: { source: AdPlatform; target: AdPlatform }[] = [
    { source: "META_ADS", target: "GOOGLE_ADS" },
    { source: "GOOGLE_ADS", target: "META_ADS" },
  ];

  let created = 0;
  const patterns: { source: AdPlatform; target: AdPlatform; ngram: string }[] = [];

  for (const dir of directions) {
    const extracted = await extractTopPatterns(userId, dir.source);

    for (const pattern of extracted) {
      const existing = await prisma.crossPlatformInsight.findFirst({
        where: {
          userId,
          sourcePlatform: dir.source,
          targetPlatform: dir.target,
          insightType: "HEADLINE_NGRAM",
          pattern: { equals: { ngram: pattern.ngram } as never },
        },
      });

      if (existing) {
        await prisma.crossPlatformInsight.update({
          where: { id: existing.id },
          data: {
            confidence: Math.min(1.0, pattern.weightedCtr * 50),
            appearsInCount: pattern.appearsIn,
          },
        });
      } else {
        await prisma.crossPlatformInsight.create({
          data: {
            userId,
            sourcePlatform: dir.source,
            targetPlatform: dir.target,
            insightType: "HEADLINE_NGRAM",
            pattern: { ngram: pattern.ngram, weightedCtr: pattern.weightedCtr } as never,
            confidence: Math.min(1.0, pattern.weightedCtr * 50),
            appearsInCount: pattern.appearsIn,
            status: "SUGGESTED",
          },
        });
        created += 1;
        patterns.push({ source: dir.source, target: dir.target, ngram: pattern.ngram });
      }
    }
  }

  return { created, patterns };
}
