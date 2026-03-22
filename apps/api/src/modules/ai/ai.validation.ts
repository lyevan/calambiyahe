import { z } from 'zod';
import { CALAMBA_BOUNDS } from '../../lib/calamba.bounds';

// ─── Reusable Calamba-Bounded Coordinate Schemas ──────────────────────────────

const calambaLat = z
  .number({ required_error: 'Latitude is required' })
  .min(CALAMBA_BOUNDS.latMin, `Latitude must be within Calamba City (≥ ${CALAMBA_BOUNDS.latMin})`)
  .max(CALAMBA_BOUNDS.latMax, `Latitude must be within Calamba City (≤ ${CALAMBA_BOUNDS.latMax})`);

const calambaLng = z
  .number({ required_error: 'Longitude is required' })
  .min(CALAMBA_BOUNDS.lngMin, `Longitude must be within Calamba City (≥ ${CALAMBA_BOUNDS.lngMin})`)
  .max(CALAMBA_BOUNDS.lngMax, `Longitude must be within Calamba City (≤ ${CALAMBA_BOUNDS.lngMax})`);

// ─── POST /api/v1/ai/reroute ──────────────────────────────────────────────────

export const rerouteSchema = z.object({
  hazardZoneId: z.string().uuid('hazardZoneId must be a valid UUID'),
  userLat: calambaLat,
  userLng: calambaLng,
  currentRouteId: z.string().uuid('currentRouteId must be a valid UUID'),
});

// ─── POST /api/v1/ai/travel-tips ──────────────────────────────────────────────

export const travelTipsSchema = z.object({
  originLat: calambaLat,
  originLng: calambaLng,
  destinationLabel: z
    .string()
    .min(2, 'Destination must be at least 2 characters')
    .max(100, 'Destination must not exceed 100 characters'),
  role: z.enum(['commuter', 'driver', 'private_driver', 'citizen', 'guide'], {
    errorMap: () => ({ message: 'role must be one of: commuter, driver, private_driver, citizen, guide' }),
  }),
});

// ─── POST /api/v1/ai/analyze-hazard ──────────────────────────────────────────

export const hazardAnalysisSchema = z.object({
  imageBase64: z.string().optional(),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']).optional(),
  lat: calambaLat,
  lng: calambaLng,
  reporterNote: z.string().max(500, 'Reporter note must not exceed 500 characters').optional(),
  reportId: z.string().uuid().optional(),
}).refine(data => data.imageBase64 || data.reportId, {
  message: "Either imageBase64 or reportId must be provided",
  path: ["imageBase64"],
});

// ─── POST /api/v1/ai/route ────────────────────────────────────────────────────

export const routeSchema = z.object({
  originLat: calambaLat,
  originLng: calambaLng,
  destLat: calambaLat,
  destLng: calambaLng,
});

// ─── Inferred Input Types ─────────────────────────────────────────────────────

export type RerouteInput = z.infer<typeof rerouteSchema>;
export type TravelTipsInput = z.infer<typeof travelTipsSchema>;
export type HazardAnalysisInput = z.infer<typeof hazardAnalysisSchema>;
export type RouteInput = z.infer<typeof routeSchema>;
