import { gpsRepository } from "../gps/gps.repository";
import { routesRepository } from "../jeepney-routes/jeepney-routes.repository";

interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity: number;
  count: number;
}

interface HeatmapResponse {
  route_id: string;
  route_code: string;
  points: HeatmapPoint[];
  generated_at: string;
}

const HEATMAP_CACHE_TTL_MS = 5_000;
const heatmapCache = new Map<
  string,
  { data: HeatmapResponse; expiresAt: number }
>();

export const heatmapService = {
  async getHeatmapForRoute(route_id: string) {
    const cached = heatmapCache.get(route_id);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    // 1. Verify route exists
    const route = await routesRepository.getRouteById(route_id);
    if (!route) throw new Error("Route not found");

    // 2. Fetch active commuter signals
    const signals = await gpsRepository.getActiveSignalsByRoute(
      route_id,
      "commuter",
    );

    // 3. Aggregate into grid (~50m cell size)
    const grid = new Map<string, { lat: number; lng: number; count: number }>();

    for (const signal of signals) {
      const cellLat = Math.round(Number(signal.lat) * 2000) / 2000;
      const cellLng = Math.round(Number(signal.lng) * 2000) / 2000;
      const key = `${cellLat}_${cellLng}`;

      const existing = grid.get(key) || {
        lat: cellLat,
        lng: cellLng,
        count: 0,
      };
      grid.set(key, { ...existing, count: existing.count + 1 });
    }

    // 4. Calculate intensity
    const points = Array.from(grid.values());
    // Cap maxCount at 5 so that 1 person is 0.2 intensity, 
    // and 5+ people are full RED intensity.
    const maxCount = Math.max(...points.map((p) => p.count), 5);

    const heatmapPoints: HeatmapPoint[] = points.map((p) => ({
      lat: p.lat,
      lng: p.lng,
      intensity: parseFloat(Math.min(1, p.count / maxCount).toFixed(2)),
      count: p.count,
    }));

    const response: HeatmapResponse = {
      route_id,
      route_code: route.code,
      points: heatmapPoints,
      generated_at: new Date().toISOString(),
    };

    heatmapCache.set(route_id, {
      data: response,
      expiresAt: Date.now() + HEATMAP_CACHE_TTL_MS,
    });

    return response;
  },

  invalidateRouteCache(route_id: string) {
    heatmapCache.delete(route_id);
  },
};
