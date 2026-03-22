import axios from "axios";
import { useAuthStore } from "../../stores/auth.store";
import { useRouteStore } from "../../stores/route.store";

export const PUBLIC_URL = "https://calambiyahe-api.incygnia.dev/api/v1";

export const ENV = {
  API_URL:
    process.env.EXPO_PUBLIC_API_URL ||
    PUBLIC_URL ||
    "http://localhost:3000/api/v1",
  BASE_URL: (
    process.env.EXPO_PUBLIC_API_URL ||
    PUBLIC_URL.replace("/api/v1", "") ||
    "http://localhost:3000/api/v1"
  ).replace("/api/v1", ""),
};

export const apiClient = axios.create({
  baseURL: ENV.API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    if (error.response?.status === 401) {
      await useAuthStore.getState().clearSession();
      useRouteStore.getState().clearSelectedRoute();
    }
    // Return standard error payload or reject
    const apiError = error.response?.data?.error || error.message;
    return Promise.reject(new Error(apiError));
  },
);
