// hooks/api/use-gps.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { gpsApi } from "../../lib/api/gps.api";
import { useRouteStore } from "../../stores/route.store";

export function useBroadcastGps() {
  const queryClient = useQueryClient();
  const { selectedRoute } = useRouteStore();

  return useMutation({
    mutationFn: (coords: { lat: number; lng: number }) => {
      if (!selectedRoute) throw new Error("No route selected");
      return gpsApi.broadcast({
        ...coords,
        route_id: selectedRoute.route_id,
      });
    },
    onSuccess: () => {
      // Invalidate heatmap if needed, but GPS signals are usually polled
      queryClient.invalidateQueries({ queryKey: ["heatmap", selectedRoute?.route_id] });
    },
  });
}

export function useGpsSignals(routeId: string) {
  return useQuery({
    queryKey: ["gps", "signals", routeId],
    queryFn: () => gpsApi.getSignals(routeId),
    refetchInterval: 15000, // Poll every 15s
    enabled: !!routeId,
  });
}
