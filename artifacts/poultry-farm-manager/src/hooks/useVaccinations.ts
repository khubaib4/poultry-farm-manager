import { useState, useEffect, useCallback } from "react";
import { vaccinations as vaccApi, vaccinationSchedule as schedApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useFarmId } from "@/hooks/useFarmId";
import type { UpcomingVaccination, CompletedVaccination, CompleteVaccinationData, SkipVaccinationData } from "@/types/electron";

interface UseVaccinationsReturn {
  upcoming: UpcomingVaccination[];
  overdue: UpcomingVaccination[];
  completed: CompletedVaccination[];
  isLoading: boolean;
  completeVaccination: (id: number, data: CompleteVaccinationData) => Promise<void>;
  skipVaccination: (id: number, data: SkipVaccinationData) => Promise<void>;
  rescheduleVaccination: (id: number, newDate: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useVaccinations(): UseVaccinationsReturn {
  const { user } = useAuth();
  const farmId = useFarmId();
  const [upcoming, setUpcoming] = useState<UpcomingVaccination[]>([]);
  const [completed, setCompleted] = useState<CompletedVaccination[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!farmId) return;
    try {
      const [up, comp] = await Promise.all([
        vaccApi.getUpcoming(farmId, 60),
        vaccApi.getCompleted(farmId),
      ]);
      setUpcoming(up);
      setCompleted(comp);
    } catch {
      setUpcoming([]);
      setCompleted([]);
    } finally {
      setIsLoading(false);
    }
  }, [farmId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const overdue = upcoming.filter(v => v.daysUntilDue < 0);

  const completeVaccination = useCallback(async (id: number, data: CompleteVaccinationData) => {
    await vaccApi.complete(id, data);
    await refetch();
  }, [refetch]);

  const skipVaccination = useCallback(async (id: number, data: SkipVaccinationData) => {
    await vaccApi.skip(id, data);
    await refetch();
  }, [refetch]);

  const rescheduleVaccination = useCallback(async (id: number, newDate: string) => {
    await vaccApi.reschedule(id, newDate);
    await refetch();
  }, [refetch]);

  return {
    upcoming,
    overdue,
    completed,
    isLoading,
    completeVaccination,
    skipVaccination,
    rescheduleVaccination,
    refetch,
  };
}
