import { z } from "zod";

export const rerouteSuggestSchema = z.object({
  route_id: z.string().uuid(),
  current_lat: z.number().optional(),
  current_lng: z.number().optional(),
  destination: z.string().min(2).optional(),
  hazard_summary: z.string().max(500).optional(),
});

export const travelTipsSchema = z.object({
  route_id: z.string().uuid().optional(),
  travel_time: z.string().min(2).optional(),
  current_lat: z.number().optional(),
  current_lng: z.number().optional(),
  objective: z
    .enum(["fastest", "least_crowded", "safer", "balanced"])
    .optional(),
});
