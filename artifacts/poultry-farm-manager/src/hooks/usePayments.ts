import { useState, useEffect, useCallback } from "react";
import { payments as paymentsApi, isElectron } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { PaymentWithDetails, PaymentFilters, PaymentsSummary } from "@/types/electron";

export function usePayments() {
  const { user } = useAuth();
  const farmId = user?.farmId ?? null;

  const [paymentsList, setPaymentsList] = useState<PaymentWithDetails[]>([]);
  const [summary, setSummary] = useState<PaymentsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<PaymentFilters>({});

  const refresh = useCallback(async () => {
    if (!isElectron() || !farmId) return;
    setIsLoading(true);
    try {
      const [list, sum] = await Promise.all([
        paymentsApi.getByFarm(farmId, filters),
        paymentsApi.getSummary(farmId),
      ]);
      setPaymentsList(list);
      setSummary(sum);
    } catch {
      setPaymentsList([]);
      setSummary(null);
    } finally {
      setIsLoading(false);
    }
  }, [farmId, filters]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { payments: paymentsList, summary, isLoading, filters, setFilters, refresh };
}
