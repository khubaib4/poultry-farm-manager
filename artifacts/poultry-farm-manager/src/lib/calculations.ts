export function calculateProductionRate(eggs: number, birds: number, days: number): number {
  if (birds <= 0 || days <= 0) return 0;
  return (eggs / (birds * days)) * 100;
}

export function calculateMortalityRate(deaths: number, initialBirds: number): number {
  if (initialBirds <= 0) return 0;
  return (deaths / initialBirds) * 100;
}

export function calculateDailyMortalityRate(deaths: number, birds: number): number {
  if (birds <= 0) return 0;
  return (deaths / birds) * 100;
}

export function calculateFCR(feedKg: number, eggsProduced: number): number {
  if (eggsProduced <= 0) return 0;
  return feedKg / eggsProduced;
}

export type Trend = "up" | "down" | "same";

export function calculateTrend(current: number, previous: number): Trend {
  if (current > previous * 1.01) return "up";
  if (current < previous * 0.99) return "down";
  return "same";
}

export type PerformanceStatus = "good" | "warning" | "critical";

interface Thresholds {
  good: number;
  warning: number;
  higherIsBetter: boolean;
}

export function getPerformanceStatus(value: number, thresholds: Thresholds): PerformanceStatus {
  if (thresholds.higherIsBetter) {
    if (value >= thresholds.good) return "good";
    if (value >= thresholds.warning) return "warning";
    return "critical";
  } else {
    if (value <= thresholds.good) return "good";
    if (value <= thresholds.warning) return "warning";
    return "critical";
  }
}

export function calculateProfitMargin(profit: number, revenue: number): number {
  if (revenue <= 0) return 0;
  return (profit / revenue) * 100;
}

export function calculatePerBirdMetrics(totals: { revenue: number; expenses: number; profit: number }, avgBirds: number) {
  if (avgBirds <= 0) return { revenuePerBird: 0, expensePerBird: 0, profitPerBird: 0 };
  return {
    revenuePerBird: totals.revenue / avgBirds,
    expensePerBird: totals.expenses / avgBirds,
    profitPerBird: totals.profit / avgBirds,
  };
}

export function calculatePerEggMetrics(totals: { revenue: number; expenses: number }, totalEggs: number) {
  if (totalEggs <= 0) return { revenuePerEgg: 0, costPerEgg: 0, profitPerEgg: 0 };
  return {
    revenuePerEgg: totals.revenue / totalEggs,
    costPerEgg: totals.expenses / totalEggs,
    profitPerEgg: (totals.revenue - totals.expenses) / totalEggs,
  };
}

export const THRESHOLDS = {
  productionRate: { good: 85, warning: 70, higherIsBetter: true as const },
  dailyMortality: { good: 0.1, warning: 0.3, higherIsBetter: false as const },
  cumulativeMortality: { good: 3, warning: 5, higherIsBetter: false as const },
  fcr: { good: 2.0, warning: 2.3, higherIsBetter: false as const },
};
