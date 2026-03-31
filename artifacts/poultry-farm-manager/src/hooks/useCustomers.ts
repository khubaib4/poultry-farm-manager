import { useState, useEffect, useCallback } from "react";
import { isElectron, customers as customersApi } from "@/lib/api";
import type { Customer, CustomerFilters } from "@/types/electron";

interface UseCustomersResult {
  customers: Customer[];
  isLoading: boolean;
  error: string | null;
  filters: CustomerFilters;
  setFilters: (filters: CustomerFilters) => void;
  refresh: () => Promise<void>;
}

export function useCustomers(farmId: number | null): UseCustomersResult {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<CustomerFilters>({ status: "active" });

  const refresh = useCallback(async () => {
    if (!farmId || !isElectron()) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await customersApi.getByFarm(farmId, filters);
      setCustomers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load customers");
    } finally {
      setIsLoading(false);
    }
  }, [farmId, filters]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { customers, isLoading, error, filters, setFilters, refresh };
}
