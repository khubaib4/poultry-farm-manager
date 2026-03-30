import { useState, useEffect, useCallback } from "react";
import { financial as financialApi } from "@/lib/api";
import type { ProfitLossData, FinancialTrendPoint, PerBirdMetrics, PerEggMetrics } from "@/types/electron";

interface UseFinancialDataResult {
  profitLoss: ProfitLossData | null;
  trends: FinancialTrendPoint[];
  perBird: PerBirdMetrics | null;
  perEgg: PerEggMetrics | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useFinancialData(
  farmId: number | null,
  startDate: string,
  endDate: string,
  groupBy: string
): UseFinancialDataResult {
  const [profitLoss, setProfitLoss] = useState<ProfitLossData | null>(null);
  const [trends, setTrends] = useState<FinancialTrendPoint[]>([]);
  const [perBird, setPerBird] = useState<PerBirdMetrics | null>(null);
  const [perEgg, setPerEgg] = useState<PerEggMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!farmId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [pl, tr, bird, egg] = await Promise.all([
        financialApi.getProfitLoss(farmId, startDate, endDate),
        financialApi.getFinancialTrends(farmId, startDate, endDate, groupBy),
        financialApi.getPerBirdMetrics(farmId, startDate, endDate),
        financialApi.getPerEggMetrics(farmId, startDate, endDate),
      ]);
      setProfitLoss(pl);
      setTrends(tr);
      setPerBird(bird);
      setPerEgg(egg);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load financial data");
      setProfitLoss(null);
      setTrends([]);
      setPerBird(null);
      setPerEgg(null);
    } finally {
      setIsLoading(false);
    }
  }, [farmId, startDate, endDate, groupBy]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { profitLoss, trends, perBird, perEgg, isLoading, error, refetch: fetchData };
}
