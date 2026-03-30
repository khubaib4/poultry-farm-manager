import { useState, useEffect, useCallback } from "react";
import { vaccinations } from "@/lib/api";
import type {
  VaccinationHistoryFilters,
  VaccinationHistoryItem,
  ComplianceStats,
} from "@/types/electron";

interface UseVaccinationHistoryReturn {
  items: VaccinationHistoryItem[];
  total: number;
  page: number;
  totalPages: number;
  stats: ComplianceStats | null;
  isLoading: boolean;
  filters: VaccinationHistoryFilters;
  setFilters: (f: Partial<VaccinationHistoryFilters>) => void;
  refetch: () => void;
}

export function useVaccinationHistory(farmId: number | null): UseVaccinationHistoryReturn {
  const [items, setItems] = useState<VaccinationHistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [stats, setStats] = useState<ComplianceStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFiltersState] = useState<VaccinationHistoryFilters>({
    page: 1,
    pageSize: 25,
    status: "all",
  });

  const setFilters = useCallback((partial: Partial<VaccinationHistoryFilters>) => {
    setFiltersState(prev => {
      const isPageChange = Object.keys(partial).length === 1 && "page" in partial;
      return { ...prev, ...partial, page: isPageChange ? (partial.page || 1) : 1 };
    });
  }, []);

  const fetchHistory = useCallback(async () => {
    if (!farmId) return;
    setIsLoading(true);
    try {
      const result = await vaccinations.getHistory(farmId, filters);
      setItems(result.items);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch {
      setItems([]);
      setTotal(0);
      setTotalPages(0);
    }
    setIsLoading(false);
  }, [farmId, filters]);

  const fetchStats = useCallback(async () => {
    if (!farmId) return;
    try {
      const s = await vaccinations.getComplianceStats(farmId);
      setStats(s);
    } catch {
      setStats(null);
    }
  }, [farmId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const refetch = useCallback(() => {
    fetchHistory();
    fetchStats();
  }, [fetchHistory, fetchStats]);

  return {
    items,
    total,
    page: filters.page || 1,
    totalPages,
    stats,
    isLoading,
    filters,
    setFilters,
    refetch,
  };
}
