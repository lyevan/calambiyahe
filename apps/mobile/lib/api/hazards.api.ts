// lib/api/hazards.api.ts
import { apiClient } from "./client";

export const hazardsApi = {
  report: async (formData: FormData) => {
    const response = await apiClient.post("/hazards", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },
  list: async () => {
    const response = await apiClient.get("/hazards");
    return response.data;
  },
};
