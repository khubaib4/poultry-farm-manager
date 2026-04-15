import { useAuth } from "@/contexts/AuthContext";
import { useOwnerFarmViewContext } from "@/contexts/OwnerFarmViewContext";

/** Effective farm id for API calls: owner farm view context, else logged-in farm user's farm. */
export function useFarmId(): number | null {
  const { user } = useAuth();
  const ownerFarm = useOwnerFarmViewContext();
  if (user?.type === "owner" && ownerFarm?.farmId != null) {
    return ownerFarm.farmId;
  }
  return user?.farmId ?? null;
}

/** True when an owner is browsing a farm under /owner/farms/:id (read-only UI). */
export function useOwnerFarmReadOnly(): boolean {
  const { user } = useAuth();
  const ownerFarm = useOwnerFarmViewContext();
  return user?.type === "owner" && ownerFarm?.farmId != null;
}
