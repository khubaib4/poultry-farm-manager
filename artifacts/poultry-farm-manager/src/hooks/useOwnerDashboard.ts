import { useState, useEffect, useCallback, useRef } from "react";
import { owner as ownerApi, isElectron } from "@/lib/api";
import type {
  OwnerDashboardStats,
  FarmOverview,
  OwnerAlert,
  RecentActivity,
} from "@/types/electron";

interface UseOwnerDashboardReturn {
  stats: OwnerDashboardStats | null;
  farms: FarmOverview[];
  alerts: OwnerAlert[];
  activity: RecentActivity[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useOwnerDashboard(ownerId: number | undefined): UseOwnerDashboardReturn {
  const [stats, setStats] = useState<OwnerDashboardStats | null>(null);
  const [farms, setFarms] = useState<FarmOverview[]>([]);
  const [alerts, setAlerts] = useState<OwnerAlert[]>([]);
  const [activity, setActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadData = useCallback(async () => {
    if (!isElectron() || !ownerId) {
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const [statsData, farmsData, alertsData, activityData] = await Promise.all([
        ownerApi.getDashboardStats(ownerId),
        ownerApi.getFarmsOverview(ownerId),
        ownerApi.getConsolidatedAlerts(ownerId),
        ownerApi.getRecentActivity(ownerId, 20),
      ]);
      setStats(statsData);
      setFarms(farmsData);
      setAlerts(alertsData);
      setActivity(activityData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  }, [ownerId]);

  useEffect(() => {
    loadData();

    intervalRef.current = setInterval(loadData, 5 * 60 * 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loadData]);

  return { stats, farms, alerts, activity, isLoading, error, refresh: loadData };
}
