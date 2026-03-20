// lib/api/auth.api.ts
import { apiClient } from "./client";
import { LoginInput, RegisterInput } from "../schemas/auth.schema";

export const authApi = {
  login: async (data: LoginInput) => {
    const response = await apiClient.post("/auth/login", data);
    return response.data;
  },
  register: async (data: RegisterInput) => {
    const response = await apiClient.post("/auth/register", data);
    return response.data;
  },
};
