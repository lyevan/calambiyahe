import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { routesApi, WaypointInput } from "../../lib/api/routes.api";

export function useRoutes() {
  return useQuery({
    queryKey: ["routes", "list"],
    queryFn: () => routesApi.getRoutes(false),
    staleTime: 10 * 60 * 1000,
  });
}

/** Admin version – fetches all routes including inactive ones. */
export function useAdminRoutes() {
  return useQuery({
    queryKey: ["routes", "list", "all"],
    queryFn: () => routesApi.getRoutes(true),
    staleTime: 0,
    refetchInterval: 10000, // Background sync every 10s
  });
}

export function useRouteDetail(id: string) {
  return useQuery({
    queryKey: ["routes", id],
    queryFn: () => routesApi.getRouteById(id),
    enabled: !!id,
    staleTime: 0,
  });
}

export function useCreateRoute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; code: string; polyline?: string }) =>
      routesApi.createRoute(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routes"] });
    },
  });
}

export function useUpdateRoute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { name?: string; is_active?: boolean; polyline?: string };
    }) => routesApi.updateRoute(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ["routes", "list", "all"] });
      const previousRoutes = queryClient.getQueryData<any[]>(["routes", "list", "all"]);
      queryClient.setQueryData(["routes", "list", "all"], (old: any[] | undefined) => 
        old?.map(r => r.route_id === id ? { ...r, ...data } : r)
      );
      return { previousRoutes };
    },
    onError: (err, variables, context) => {
      if (context?.previousRoutes) {
        queryClient.setQueryData(["routes", "list", "all"], context.previousRoutes);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["routes"] });
    },
  });
}

export function useBulkUpdateWaypoints() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ routeId, waypoints }: { routeId: string; waypoints: WaypointInput[] }) =>
      routesApi.bulkUpdateWaypoints(routeId, waypoints),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["routes", variables.routeId] });
    },
  });
}

export function useDeleteRoute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => routesApi.deleteRoute(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["routes", "list", "all"] });
      const previousRoutes = queryClient.getQueryData<any[]>(["routes", "list", "all"]);
      queryClient.setQueryData(["routes", "list", "all"], (old: any[] | undefined) => 
        old?.filter(r => r.route_id !== id)
      );
      return { previousRoutes };
    },
    onError: (err, id, context) => {
      if (context?.previousRoutes) {
        queryClient.setQueryData(["routes", "list", "all"], context.previousRoutes);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["routes"] });
    },
  });
}
