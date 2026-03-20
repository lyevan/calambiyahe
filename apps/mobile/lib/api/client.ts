// lib/api/client.ts
import axios from "axios";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { useAuthStore } from "../../stores/auth.store";

const API_URL = Constants.expoConfig?.extra?.apiUrl || "http://localhost:3000/api/v1";

export const apiClient = axios.create({
  baseURL: API_URL,
});

apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Handle logout or refresh
      await SecureStore.deleteItemAsync("token");
    }
    return Promise.reject(error);
  }
);
