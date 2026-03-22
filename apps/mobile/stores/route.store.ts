import { create } from "zustand";

interface RouteDefinition {
  route_id: string;
  name: string;
  code: string;
}

interface RouteStore {
  selectedRoute: RouteDefinition | null;
  setSelectedRoute: (route: RouteDefinition) => void;
  clearSelectedRoute: () => void;
}

export const useRouteStore = create<RouteStore>((set) => ({
  selectedRoute: null,
  setSelectedRoute: (route) => set({ selectedRoute: route }),
  clearSelectedRoute: () => set({ selectedRoute: null }),
}));
