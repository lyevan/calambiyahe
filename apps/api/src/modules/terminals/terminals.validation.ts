import { z } from "zod";

const coordinate = z.number().refine((value) => Number.isFinite(value), {
  message: "Invalid coordinate",
});

export const createTerminalSchema = z.object({
  name: z.string().min(2).max(120),
  lat: coordinate,
  lng: coordinate,
  address: z.string().min(4).max(255).optional(),
});

export const updateTerminalSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  lat: coordinate.optional(),
  lng: coordinate.optional(),
  address: z.string().min(4).max(255).optional(),
});

export const createWaitingSpotSchema = z.object({
  route_id: z.string().uuid(),
  label: z.string().min(2).max(120),
  lat: coordinate,
  lng: coordinate,
});
