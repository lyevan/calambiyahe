import { z } from "zod";

export const gpsBroadcastSchema = z.object({
  route_id: z.string().uuid(),
  lat: z.number(),
  lng: z.number(),
});

export const driverRouteSchema = z.object({
  route_id: z.string().uuid(),
});
