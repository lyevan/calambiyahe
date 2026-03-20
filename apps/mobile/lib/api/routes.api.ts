// lib/api/routes.api.ts
import { apiClient } from "./client";

export const routesApi = {
  list: async () => {
    const response = await apiClient.get("/routes");
    return response.data;
  },
  getById: async (id: string) => {
    const response = await apiClient.get(`/routes/${id}`);
    return response.data;
  },
};
