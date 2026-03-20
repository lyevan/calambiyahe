import { gpsRepository } from "./gps.repository";
import { isWithinCalamba } from "../../lib/calamba.bounds";
import { routesRepository } from "../jeepney-routes/jeepney-routes.repository";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { heatmapService } from "../heatmap/heatmap.service";

const gpsBroadcastLimiter = new RateLimiterMemory({
  points: 1,
  duration: 10,
});

type ServiceError = Error & { statusCode?: number };

function createServiceError(message: string, statusCode: number): ServiceError {
  const error = new Error(message) as ServiceError;
  error.statusCode = statusCode;
  return error;
}

export const gpsService = {
  async broadcastSignal(userId: string, role: string, data: any) {
    try {
      await gpsBroadcastLimiter.consume(userId);
    } catch {
      throw createServiceError(
        "Too many GPS broadcasts. Please wait before sending another signal.",
        429,
      );
    }

    // 1. Validate coordinates
    if (!isWithinCalamba(data.lat, data.lng)) {
      throw createServiceError(
        "Coordinates are outside Calamba City bounds",
        400,
      );
    }

    // 2. Validate route exists and is active
    const route = await routesRepository.getRouteById(data.route_id);
    if (!route || !route.is_active) {
      throw createServiceError("Invalid or inactive route ID", 404);
    }

    // 3. Set expiration (5 minutes)
    const emittedAt = new Date();
    const expiresAt = new Date(emittedAt.getTime() + 5 * 60 * 1000);

    const savedSignal = await gpsRepository.saveSignal({
      user_id: userId,
      route_id: data.route_id,
      lat: data.lat.toString(),
      lng: data.lng.toString(),
      role,
      emitted_at: emittedAt,
      expires_at: expiresAt,
    });

    heatmapService.invalidateRouteCache(data.route_id);

    return savedSignal;
  },

  async getSignalsByRoute(route_id: string) {
    const route = await routesRepository.getRouteById(route_id);
    if (!route || !route.is_active) {
      throw createServiceError("Route not found", 404);
    }

    return await gpsRepository.getActiveSignalsByRoute(route_id);
  },

  async invalidateSignal(signal_id: string) {
    const deleted = await gpsRepository.deleteSignal(signal_id);
    if (!deleted.length) {
      throw createServiceError("Signal not found", 404);
    }

    heatmapService.invalidateRouteCache(deleted[0].route_id);
    return deleted[0];
  },

  async startDriverRoute(userId: string, role: string, routeId: string) {
    if (role !== "driver") {
      throw createServiceError("Only drivers can start route sessions", 403);
    }

    const route = await routesRepository.getRouteById(routeId);
    if (!route || !route.is_active) {
      throw createServiceError("Invalid or inactive route ID", 404);
    }

    await gpsRepository.endActiveDriverSession(userId);
    return await gpsRepository.startDriverSession(userId, routeId);
  },

  async endDriverRoute(userId: string, role: string) {
    if (role !== "driver") {
      throw createServiceError("Only drivers can end route sessions", 403);
    }

    const ended = await gpsRepository.endActiveDriverSession(userId);
    if (!ended.length) {
      throw createServiceError("No active driver route session found", 404);
    }

    return ended[0];
  },

  async getActiveDriverRoute(userId: string, role: string) {
    if (role !== "driver") {
      throw createServiceError(
        "Only drivers can view active route session",
        403,
      );
    }

    const session = await gpsRepository.getActiveDriverSession(userId);
    if (!session) {
      throw createServiceError("No active driver route session", 404);
    }

    return session;
  },
};
