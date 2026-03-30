import { useState, useEffect, useCallback } from "react";
import { eggPrices } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface EggPriceRecord {
  id: number;
  grade: string;
  pricePerEgg: number;
  pricePerTray: number;
  effectiveDate: string;
}

type PricesMap = Record<string, EggPriceRecord | null>;

export function useCurrentPrices() {
  const { user } = useAuth();
  const farmId = user?.farmId ?? null;
  const [prices, setPrices] = useState<PricesMap>({ A: null, B: null, cracked: null });
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!farmId) return;
    setIsLoading(true);
    try {
      const data = await eggPrices.getCurrentPrices(farmId);
      setPrices(data as PricesMap);
    } catch {
      setPrices({ A: null, B: null, cracked: null });
    } finally {
      setIsLoading(false);
    }
  }, [farmId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { prices, isLoading, refetch };
}
