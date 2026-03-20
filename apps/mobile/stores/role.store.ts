// stores/role.store.ts
import { create } from "zustand";

type Role = "commuter" | "driver" | "citizen" | "admin" | null;

interface RoleStore {
  role: Role;
  setRole: (role: Role) => void;
}

export const useRoleStore = create<RoleStore>((set) => ({
  role: null,
  setRole: (role) => set({ role }),
}));
