import { z } from "zod";

export const registerSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  role: z.enum(["commuter", "driver", "private_driver", "citizen", "guide"]),
});

export const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});
