import { z } from "zod";

export const createHazardSchema = z.object({
  type: z.enum(["pothole", "flood", "accident", "roadblock", "construction", "other"]),
  severity: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  lat: z.coerce.number(),
  lng: z.coerce.number(),
});

export const updateHazardSchema = z.object({
  status: z.enum(["pending", "confirmed", "rejected"]).optional(),
});

export const potholeZoneSchema = z.object({
  start_lat: z.coerce.number(),
  start_lng: z.coerce.number(),
  end_lat: z.coerce.number(),
  end_lng: z.coerce.number(),
});
