// lib/api/heatmap.api.ts
import { apiClient } from "./client";

export const heatmapApi = {
  get: async (routeId: string) => {
    const response = await apiClient.get(`/heatmap/${routeId}`);
    return response.data;
  },
};
