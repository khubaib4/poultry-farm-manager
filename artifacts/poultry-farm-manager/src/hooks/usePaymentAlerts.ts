import { useState, useEffect, useCallback, useRef } from "react";
import { isElectron, alerts as alertsApi } from "@/lib/api";
import type { PaymentAlert } from "@/types/electron";

interface UsePaymentAlertsResult {
  alerts: PaymentAlert[];
  overdueCount: number;
  overdueAmount: number;
  isLoading: boolean;
  refetch: () => void;
}

export function usePaymentAlerts(farmId: number | null, refreshInterval = 60000): UsePaymentAlertsResult {
  const [alerts, setAlerts] = useState<PaymentAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetch = useCallback(async () => {
    if (!farmId || !isElectron()) {
      setIsLoading(false);
      return;
    }
    try {
      const data = await alertsApi.getPaymentAlerts(farmId);
      setAlerts(data);
    } catch {
      setAlerts([]);
    } finally {
      setIsLoading(false);
    }
  }, [farmId]);

  useEffect(() => {
    fetch();
    if (refreshInterval > 0) {
      intervalRef.current = setInterval(fetch, refreshInterval);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetch, refreshInterval]);

  const overdueAlerts = alerts.filter(a => a.type === "overdue");

  return {
    alerts,
    overdueCount: overdueAlerts.length,
    overdueAmount: overdueAlerts.reduce((s, a) => s + a.balanceDue, 0),
    isLoading,
    refetch: fetch,
  };
}
