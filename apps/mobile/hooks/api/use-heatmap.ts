// hooks/api/use-heatmap.ts
import { useQuery } from "@tanstack/react-query";
import { heatmapApi } from "../../lib/api/heatmap.api";

export function useHeatmap(routeId: string) {
  return useQuery({
    queryKey: ["heatmap", routeId],
    queryFn: () => heatmapApi.get(routeId),
    refetchInterval: 15000,
    enabled: !!routeId,
  });
}
