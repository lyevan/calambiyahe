import { z } from "zod";

export const createRouteSchema = z.object({
  name: z.string().min(3),
  code: z.string().regex(/^CAL-\d{2}$/),
});

export const updateRouteSchema = z.object({
  name: z.string().min(3).optional(),
  is_active: z.boolean().optional(),
});

export const waypointSchema = z.object({
  sequence: z.number().int().positive(),
  lat: z.number(),
  lng: z.number(),
  label: z.string().optional(),
  is_key_stop: z.boolean().default(false),
});

export const bulkWaypointsSchema = z.array(waypointSchema);
