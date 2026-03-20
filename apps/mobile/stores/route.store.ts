// stores/route.store.ts
import { create } from "zustand";

interface RouteStore {
  selectedRoute: { route_id: string; name: string; code: string } | null;
  setSelectedRoute: (route: RouteStore["selectedRoute"]) => void;
  clearSelectedRoute: () => void;
}

export const useRouteStore = create<RouteStore>((set) => ({
  selectedRoute: null,
  setSelectedRoute: (route) => set({ selectedRoute: route }),
  clearSelectedRoute: () => set({ selectedRoute: null }),
}));
