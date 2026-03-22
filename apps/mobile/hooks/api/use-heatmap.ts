import { useQuery } from '@tanstack/react-query';
import { heatmapApi, HeatmapData } from '../../lib/api/heatmap.api';

export function useHeatmap(routeId?: string) {
  return useQuery<HeatmapData, Error>({
    queryKey: ['heatmap', routeId],
    queryFn: () => heatmapApi.getHeatmapForRoute(routeId!),
    enabled: !!routeId,
    refetchInterval: 5_000,
    staleTime: 5_000,
  });
}
