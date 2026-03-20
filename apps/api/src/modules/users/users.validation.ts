import { z } from "zod";

export const updateProfileSchema = z.object({
  username: z.string().min(3).max(50).optional(),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(["commuter", "driver", "admin"]),
});
