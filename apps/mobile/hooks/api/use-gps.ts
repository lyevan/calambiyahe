import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { gpsApi } from '../../lib/api/gps.api';
import { useRouteStore } from '../../stores/route.store';

export function useBroadcastGps() {
  const queryClient = useQueryClient();
  const selectedRoute = useRouteStore((state) => state.selectedRoute);

  return useMutation({
    mutationFn: (coords: { lat: number; lng: number }) => {
      if (!selectedRoute) throw new Error("No route selected");
      return gpsApi.broadcast({
        lat: coords.lat,
        lng: coords.lng,
        route_id: selectedRoute.route_id,
      });
    },
    onSuccess: () => {
      // Invalidate live data scopes mapped to this route
      queryClient.invalidateQueries({ queryKey: ["heatmap", selectedRoute?.route_id] });
      queryClient.invalidateQueries({ queryKey: ["gps", "signals", selectedRoute?.route_id] });
    },
  });
}

export function useGpsSignals(routeId?: string) {
  return useQuery({
    queryKey: ['gps', 'signals', routeId],
    queryFn: () => gpsApi.getSignals(routeId!),
    enabled: !!routeId,
    refetchInterval: 10_000,
    staleTime: 10_000,
  });
}

export function useDriverRouteSession() {
  const queryClient = useQueryClient();

  const startRoute = useMutation({
    mutationFn: (routeId: string) => gpsApi.startDriverRoute(routeId),
  });

  const endRoute = useMutation({
    mutationFn: () => gpsApi.endDriverRoute(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driver", "active-route"] });
    }
  });

  return { startRoute, endRoute };
}
