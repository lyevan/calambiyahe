import { z } from "zod";

export const createHazardSchema = z.object({
  type: z.enum(["pothole", "flood", "accident", "roadblock"]),
  description: z.string().optional(),
  lat: z.number(),
  lng: z.number(),
});

export const updateHazardSchema = z.object({
  status: z.enum(["pending", "verified", "resolved"]).optional(),
});

export const potholeZoneSchema = z.object({
  start_lat: z.number(),
  start_lng: z.number(),
  end_lat: z.number(),
  end_lng: z.number(),
});
