// stores/auth.store.ts
import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

interface AuthStore {
  user: any | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: any, token: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  setAuth: async (user, token) => {
    await SecureStore.setItemAsync("token", token);
    set({ user, token, isAuthenticated: true });
  },
  logout: async () => {
    await SecureStore.deleteItemAsync("token");
    set({ user: null, token: null, isAuthenticated: false });
  },
}));
