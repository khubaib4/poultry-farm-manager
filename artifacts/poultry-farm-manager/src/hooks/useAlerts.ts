import { useState, useEffect, useCallback, useRef } from "react";
import { alerts as alertsApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useFarmId } from "@/hooks/useFarmId";
import type { FarmAlert } from "@/types/electron";

interface UseAlertsReturn {
  alerts: FarmAlert[];
  activeAlerts: FarmAlert[];
  dismissedAlerts: FarmAlert[];
  lowStock: FarmAlert[];
  expiring: FarmAlert[];
  vaccinations: FarmAlert[];
  activeCount: number;
  criticalCount: number;
  isLoading: boolean;
  dismiss: (alert: FarmAlert) => Promise<void>;
  undismiss: (alert: FarmAlert) => Promise<void>;
  clearDismissed: () => Promise<void>;
  refetch: () => Promise<void>;
}

const REFRESH_INTERVAL = 5 * 60 * 1000;

export function useAlerts(): UseAlertsReturn {
  const { user } = useAuth();
  const farmId = useFarmId();
  const [alerts, setAlerts] = useState<FarmAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refetch = useCallback(async () => {
    if (!farmId) return;
    try {
      const data = await alertsApi.getAll(farmId);
      setAlerts(data);
    } catch {
      setAlerts([]);
    } finally {
      setIsLoading(false);
    }
  }, [farmId]);

  useEffect(() => {
    refetch();
    intervalRef.current = setInterval(refetch, REFRESH_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refetch]);

  const activeAlerts = alerts.filter(a => !a.isDismissed);
  const dismissedAlerts = alerts.filter(a => a.isDismissed);
  const lowStock = alerts.filter(a => a.type === "low_stock");
  const expiring = alerts.filter(a => a.type === "expiring");
  const vaccinations = alerts.filter(a => a.type === "vaccination_due");
  const activeCount = activeAlerts.length;
  const criticalCount = activeAlerts.filter(a => a.severity === "critical").length;

  const dismiss = useCallback(async (alert: FarmAlert) => {
    if (!farmId) return;
    const [alertType, refIdStr] = alert.id.split(":");
    await alertsApi.dismiss(farmId, alertType, parseInt(refIdStr, 10));
    setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, isDismissed: true } : a));
  }, [farmId]);

  const undismiss = useCallback(async (alert: FarmAlert) => {
    if (!farmId) return;
    const [alertType, refIdStr] = alert.id.split(":");
    await alertsApi.undismiss(farmId, alertType, parseInt(refIdStr, 10));
    setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, isDismissed: false } : a));
  }, [farmId]);

  const clearDismissed = useCallback(async () => {
    if (!farmId) return;
    await alertsApi.clearDismissed(farmId);
    setAlerts(prev => prev.map(a => ({ ...a, isDismissed: false })));
  }, [farmId]);

  return {
    alerts,
    activeAlerts,
    dismissedAlerts,
    lowStock,
    expiring,
    vaccinations,
    activeCount,
    criticalCount,
    isLoading,
    dismiss,
    undismiss,
    clearDismissed,
    refetch,
  };
}
