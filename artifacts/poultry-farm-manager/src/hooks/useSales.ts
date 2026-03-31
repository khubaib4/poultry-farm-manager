import { useState, useEffect, useCallback } from "react";
import { isElectron, sales as salesApi } from "@/lib/api";
import type { SaleWithCustomer, SaleFilters, SalesSummary } from "@/types/electron";

interface UseSalesResult {
  sales: SaleWithCustomer[];
  summary: SalesSummary | null;
  isLoading: boolean;
  error: string | null;
  filters: SaleFilters;
  setFilters: (filters: SaleFilters) => void;
  refresh: () => Promise<void>;
}

export function useSales(farmId: number | null): UseSalesResult {
  const [sales, setSales] = useState<SaleWithCustomer[]>([]);
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const today = now.toISOString().split("T")[0];

  const [filters, setFilters] = useState<SaleFilters>({
    startDate: firstOfMonth,
    endDate: today,
  });

  const refresh = useCallback(async () => {
    if (!farmId || !isElectron()) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const [salesData, summaryData] = await Promise.all([
        salesApi.getByFarm(farmId, filters),
        salesApi.getSummary(
          farmId,
          filters.startDate || firstOfMonth,
          filters.endDate || today
        ),
      ]);
      setSales(salesData);
      setSummary(summaryData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sales");
    } finally {
      setIsLoading(false);
    }
  }, [farmId, filters, firstOfMonth, today]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { sales, summary, isLoading, error, filters, setFilters, refresh };
}
