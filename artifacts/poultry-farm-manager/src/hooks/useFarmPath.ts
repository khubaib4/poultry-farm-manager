import { useOwnerFarmViewContext } from "@/contexts/OwnerFarmViewContext";

/**
 * Build absolute app paths for farm UI. Under owner farm view, paths are `/owner/farms/:id/...`
 * instead of `/farm/...`.
 */
export function useFarmPath(): (relativePath: string) => string {
  const ownerFarm = useOwnerFarmViewContext();
  return (relativePath: string) => {
    const r = relativePath.replace(/^\//, "");
    if (ownerFarm?.farmId != null) {
      return `/owner/farms/${ownerFarm.farmId}/${r}`;
    }
    return `/farm/${r}`;
  };
}
