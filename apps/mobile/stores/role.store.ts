import { create } from "zustand";

export type Role = "commuter" | "driver" | "private_driver" | "citizen" | "guide" | "admin";

interface RoleStore {
  activeRole: Role | null;
  setActiveRole: (role: Role) => void;
  clearRole: () => void;
}

export const useRoleStore = create<RoleStore>((set) => ({
  activeRole: null,
  setActiveRole: (role) => set({ activeRole: role }),
  clearRole: () => set({ activeRole: null }),
}));
