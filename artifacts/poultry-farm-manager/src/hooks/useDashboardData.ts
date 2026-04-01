import { useState, useEffect, useCallback, useRef } from "react";
import { dashboard as dashboardApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface FlockInfo {
  id: number;
  batchName: string;
  breed?: string | null;
  currentCount: number;
  initialCount: number;
  arrivalDate: string;
  ageAtArrivalDays: number;
  hasEntryToday: boolean;
}

interface RecentSale {
  id: number;
  invoiceNumber: string;
  saleDate: string;
  totalAmount: number;
  paymentStatus: string;
  customerName: string;
}

interface FarmStats {
  totalBirds: number;
  totalInitialBirds: number;
  activeFlockCount: number;
  todayEggs: number;
  todayDeaths: number;
  todayFeed: number;
  flocksCompleted: number;
  flocksTotal: number;
  flocks: FlockInfo[];
  todaySalesCount: number;
  todaySalesAmount: number;
  monthRevenue: number;
  monthExpenses: number;
  monthProfit: number;
  totalOutstanding: number;
  recentSales: RecentSale[];
}

interface WeekData {
  eggs: number;
  deaths: number;
  feed: number;
  daysWithData: number;
}

interface WeeklyTrends {
  thisWeek: WeekData;
  lastWeek: WeekData;
  avgEggsThisWeek: number;
  avgEggsLastWeek: number;
  productionRate: number;
  dailyMortalityRate: number;
  cumulativeMortality: number;
  fcr: number;
  totalBirds: number;
}

interface Alert {
  type: "critical" | "warning" | "info";
  message: string;
  link?: string;
}

interface DashboardData {
  stats: FarmStats | null;
  trends: WeeklyTrends | null;
  alerts: Alert[];
  isLoading: boolean;
  lastUpdated: Date | null;
  refetch: () => Promise<void>;
}

const REFRESH_INTERVAL = 5 * 60 * 1000;

export function useDashboardData(): DashboardData {
  const { user } = useAuth();
  const farmId = user?.farmId ?? null;
  const [stats, setStats] = useState<FarmStats | null>(null);
  const [trends, setTrends] = useState<WeeklyTrends | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refetch = useCallback(async () => {
    if (!farmId) return;
    setIsLoading(true);
    try {
      const [s, t, a] = await Promise.all([
        dashboardApi.getFarmStats(farmId),
        dashboardApi.getWeeklyTrends(farmId),
        dashboardApi.getAlerts(farmId),
      ]);
      setStats(s as FarmStats);
      setTrends(t as WeeklyTrends);
      setAlerts(a as Alert[]);
      setLastUpdated(new Date());
    } catch {
      setStats(null);
      setTrends(null);
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

  return { stats, trends, alerts, isLoading, lastUpdated, refetch };
}
