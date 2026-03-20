import { routesRepository } from "./jeepney-routes.repository";
import { isWithinCalamba } from "../../lib/calamba.bounds";

type ServiceError = Error & { statusCode?: number };

function createServiceError(message: string, statusCode: number): ServiceError {
  const error = new Error(message) as ServiceError;
  error.statusCode = statusCode;
  return error;
}

export const routesService = {
  async createRoute(data: any, userId: string) {
    return await routesRepository.createRoute({ ...data, created_by: userId });
  },

  async listRoutes(onlyActive = true) {
    return await routesRepository.getAllRoutes(onlyActive);
  },

  async getRouteDetail(id: string) {
    const route = await routesRepository.getRouteById(id);
    if (!route) throw createServiceError("Route not found", 404);
    return route;
  },

  async updateRoute(id: string, data: any) {
    return await routesRepository.updateRoute(id, data);
  },

  async deleteRoute(id: string) {
    return await routesRepository.deleteRoute(id);
  },

  async bulkUpdateWaypoints(route_id: string, waypoints: any[]) {
    const route = await routesRepository.getRouteById(route_id);
    if (!route) {
      throw createServiceError("Route not found", 404);
    }

    // Validate each waypoint is within Calamba
    for (const wp of waypoints) {
      if (!isWithinCalamba(Number(wp.lat), Number(wp.lng))) {
        throw createServiceError(
          `Waypoint at (${wp.lat}, ${wp.lng}) is outside Calamba City bounds`,
          400,
        );
      }
    }

    // Validate unique and contiguous sequence
    const sequences = waypoints.map((w) => w.sequence).sort((a, b) => a - b);
    for (let i = 0; i < sequences.length; i++) {
      if (sequences[i] !== i + 1) {
        throw createServiceError(
          "Waypoint sequences must start at 1 and be contiguous",
          400,
        );
      }
    }

    const waypointsToInsert = waypoints.map((wp) => ({
      ...wp,
      route_id,
      lat: wp.lat.toString(), // numeric in drizzle
      lng: wp.lng.toString(),
    }));

    return await routesRepository.replaceWaypoints(route_id, waypointsToInsert);
  },

  async addWaypoint(route_id: string, waypoint: any) {
    const route = await routesRepository.getRouteById(route_id);
    if (!route) {
      throw createServiceError("Route not found", 404);
    }

    if (!isWithinCalamba(Number(waypoint.lat), Number(waypoint.lng))) {
      throw createServiceError(
        "Waypoint coordinates are outside Calamba City bounds",
        400,
      );
    }

    const existingWaypoints = route.waypoints ?? [];
    const expectedSequence = existingWaypoints.length + 1;
    if (waypoint.sequence !== expectedSequence) {
      throw createServiceError(
        `New waypoint sequence must be ${expectedSequence}`,
        400,
      );
    }

    return await routesRepository.addWaypoint({
      route_id,
      sequence: waypoint.sequence,
      lat: waypoint.lat.toString(),
      lng: waypoint.lng.toString(),
      label: waypoint.label,
      is_key_stop: waypoint.is_key_stop,
    });
  },

  async deleteWaypoint(route_id: string, waypoint_id: string) {
    const route = await routesRepository.getRouteById(route_id);
    if (!route) {
      throw createServiceError("Route not found", 404);
    }

    const waypoint = await routesRepository.getWaypointById(waypoint_id);
    if (!waypoint || waypoint.route_id !== route_id) {
      throw createServiceError("Waypoint not found in this route", 404);
    }

    await routesRepository.deleteWaypoint(waypoint_id);

    const remaining = await routesRepository.getWaypointsByRoute(route_id);
    for (let index = 0; index < remaining.length; index++) {
      const expectedSequence = index + 1;
      if (remaining[index].sequence !== expectedSequence) {
        await routesRepository.updateWaypointSequence(
          remaining[index].waypoint_id,
          expectedSequence,
        );
      }
    }

    return await routesRepository.getWaypointsByRoute(route_id);
  },
};
