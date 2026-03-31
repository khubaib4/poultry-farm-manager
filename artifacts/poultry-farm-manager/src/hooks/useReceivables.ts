import { useState, useEffect, useCallback } from "react";
import { receivables as receivablesApi, payments as paymentsApi, isElectron } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { ReceivableItem, PaymentsSummary } from "@/types/electron";

export function useReceivables(filter?: string) {
  const { user } = useAuth();
  const farmId = user?.farmId ?? null;

  const [receivables, setReceivables] = useState<ReceivableItem[]>([]);
  const [summary, setSummary] = useState<PaymentsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!isElectron() || !farmId) return;
    setIsLoading(true);
    try {
      const [list, sum] = await Promise.all([
        receivablesApi.getByFarm(farmId, filter),
        paymentsApi.getSummary(farmId),
      ]);
      setReceivables(list);
      setSummary(sum);
    } catch {
      setReceivables([]);
      setSummary(null);
    } finally {
      setIsLoading(false);
    }
  }, [farmId, filter]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { receivables, summary, isLoading, refresh };
}
