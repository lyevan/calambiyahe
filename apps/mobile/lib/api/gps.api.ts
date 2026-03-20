// lib/api/gps.api.ts
import { apiClient } from "./client";

export const gpsApi = {
  broadcast: async (data: { lat: number; lng: number; route_id: string }) => {
    const response = await apiClient.post("/gps/broadcast", data);
    return response.data;
  },
  getSignals: async (routeId: string) => {
    const response = await apiClient.get(`/gps/signals/${routeId}`);
    return response.data;
  },
};
