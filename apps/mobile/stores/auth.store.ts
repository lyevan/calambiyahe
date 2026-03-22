import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { Role, useRoleStore } from "./role.store";

interface User {
  user_id: string;
  username: string;
  role: Role;
  is_admin: boolean;
}

interface AuthStore {
  token: string | null;
  user: User | null;
  hydrated: boolean;
  isAuthenticated: boolean;
  setSession: (token: string, user: User) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  updateToken: (token: string) => Promise<void>;
  clearSession: () => Promise<void>;
  hydrateSession: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  token: null,
  user: null,
  hydrated: false,
  isAuthenticated: false,
  setSession: async (token, user) => {
    await SecureStore.setItemAsync("auth_token", token);
    await SecureStore.setItemAsync("auth_user", JSON.stringify(user));
    
    // Sync active role
    useRoleStore.getState().setActiveRole(user.role);
    
    set({ token, user, isAuthenticated: true });
  },
  updateUser: async (user) => {
    await SecureStore.setItemAsync("auth_user", JSON.stringify(user));
    set({ user });
  },
  updateToken: async (token) => {
    await SecureStore.setItemAsync("auth_token", token);
    set({ token });
  },
  clearSession: async () => {
    await SecureStore.deleteItemAsync("auth_token");
    await SecureStore.deleteItemAsync("auth_user");
    
    // Clear active role
    useRoleStore.getState().clearRole();
    
    set({ token: null, user: null, isAuthenticated: false });
  },
  hydrateSession: async () => {
    try {
      const token = await SecureStore.getItemAsync("auth_token");
      const userStr = await SecureStore.getItemAsync("auth_user");
      if (token && userStr) {
        const user = JSON.parse(userStr);
        
        // Sync active role if not already set
        if (!useRoleStore.getState().activeRole) {
          useRoleStore.getState().setActiveRole(user.role);
        }
        
        set({ token, user, isAuthenticated: true, hydrated: true });
      } else {
        set({ hydrated: true });
      }
    } catch {
      set({ hydrated: true });
    }
  },
}));
