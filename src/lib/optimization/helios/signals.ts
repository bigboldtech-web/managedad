import type { CampaignSignals } from "./types";

interface DailyPoint {
  date: Date;
  spend: number;
  revenue: number;
  conversions: number;
}

export function computeSignals(daily: DailyPoint[], dailyBudget: number): CampaignSignals {
  if (daily.length === 0) {
    return { trend7d: 0, velocity: 0, volatility: 0, saturation: 0 };
  }

  const sorted = [...daily].sort((a, b) => a.date.getTime() - b.date.getTime());
  const last7 = sorted.slice(-7);

  const roasSeries = last7.map((d) => (d.spend > 0 ? d.revenue / d.spend : 0));
  const trend7d = ordinaryLeastSquaresSlope(roasSeries);

  const todaySpend = sorted[sorted.length - 1]?.spend ?? 0;
  const yesterdaySpend = sorted[sorted.length - 2]?.spend ?? 0;
  const velocity = yesterdaySpend > 0 ? (todaySpend - yesterdaySpend) / yesterdaySpend : 0;

  const volatility = relativeStdev(roasSeries);

  const recentSpend = last7.slice(-3).reduce((s, d) => s + d.spend, 0) / Math.min(3, last7.length);
  const saturation = dailyBudget > 0 ? recentSpend / dailyBudget : 0;

  return { trend7d, velocity, volatility, saturation };
}

function ordinaryLeastSquaresSlope(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumX2 += i * i;
  }
  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return 0;
  return (n * sumXY - sumX * sumY) / denom;
}

function relativeStdev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  if (mean === 0) return 0;
  const variance =
    values.reduce((s, v) => s + (v - mean) * (v - mean), 0) / values.length;
  return Math.sqrt(variance) / Math.abs(mean);
}

export function linearRegressionSlope(values: number[]): number {
  return ordinaryLeastSquaresSlope(values);
}
