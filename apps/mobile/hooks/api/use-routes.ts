// hooks/api/use-routes.ts
import { useQuery } from "@tanstack/react-query";
import { routesApi } from "../../lib/api/routes.api";

export function useRoutes() {
  return useQuery({
    queryKey: ["routes", "list"],
    queryFn: () => routesApi.list(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useRouteDetails(id: string) {
  return useQuery({
    queryKey: ["routes", id],
    queryFn: () => routesApi.getById(id),
    enabled: !!id,
  });
}
