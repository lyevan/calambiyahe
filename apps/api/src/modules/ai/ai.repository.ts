import { and, gte, lte, eq } from "drizzle-orm";
import { db } from "../../db";
import { potholeZones } from "../../db/schema/pothole_zones";
import { hazardReports } from "../../db/schema/hazard_reports";
import { jeepneyRoutes } from "../../db/schema/jeepney_routes";
import { terminals } from "../../db/schema/terminals";
import { routeWaypoints } from "../../db/schema/route_waypoints";
import { waitingSpots } from "../../db/schema/waiting_spots";
import { HazardZoneContext, RouteContext, TerminalContext } from "./ai.types";

// ─── AI Repository ────────────────────────────────────────────────────────────
// Read-only. This repository builds context from other module tables
// to supply Gemini with accurate, Calamba-specific data.

export const aiRepository = {
  /**
   * Fetch a pothole zone + its linked hazard report for rerouting context.
   */
  async getHazardZoneById(zoneId: string): Promise<HazardZoneContext | null> {
    const rows = await db
      .select({
        zoneId: potholeZones.zone_id,
        startLat: potholeZones.start_lat,
        startLng: potholeZones.start_lng,
        endLat: potholeZones.end_lat,
        endLng: potholeZones.end_lng,
        hazardType: hazardReports.type,
      })
      .from(potholeZones)
      .leftJoin(
        hazardReports,
        eq(potholeZones.report_id, hazardReports.report_id),
      )
      .where(eq(potholeZones.zone_id, zoneId))
      .limit(1);

    if (!rows[0]) return null;
    const row = rows[0];

    return {
      zoneId: row.zoneId,
      startLat: parseFloat(row.startLat),
      startLng: parseFloat(row.startLng),
      endLat: parseFloat(row.endLat),
      endLng: parseFloat(row.endLng),
      hazardType: row.hazardType ?? "unknown",
      severity: "medium",
      roadName: null,
    };
  },

  /**
   * Fetch a single route by ID (for current route context).
   */
  async getRouteById(routeId: string): Promise<RouteContext | null> {
    const rows = await db
      .select()
      .from(jeepneyRoutes)
      .where(eq(jeepneyRoutes.route_id, routeId))
      .limit(1);

    if (!rows[0]) return null;
    const r = rows[0];

    const waypointRows = await db
      .select({
        label: routeWaypoints.label,
        sequence: routeWaypoints.sequence,
        isKeyStop: routeWaypoints.is_key_stop,
      })
      .from(routeWaypoints)
      .where(eq(routeWaypoints.route_id, routeId));

    const sortedWaypoints = waypointRows.sort(
      (a, b) => a.sequence - b.sequence,
    );
    const labeledStops = sortedWaypoints
      .filter((w) => w.label && (w.isKeyStop ?? false))
      .map((w) => w.label as string);

    const firstLabel = sortedWaypoints.find((w) => w.label)?.label ?? null;
    const lastLabel =
      [...sortedWaypoints].reverse().find((w) => w.label)?.label ?? null;

    return {
      routeId: r.route_id,
      routeCode: r.code,
      fromTerminal: firstLabel,
      toTerminal: lastLabel,
      keyStops: labeledStops,
    };
  },

  /**
   * Fetch all Calamba jeepney routes — used to give Gemini alternative options.
   */
  async getAllRoutes(): Promise<RouteContext[]> {
    const routes = await db
      .select()
      .from(jeepneyRoutes)
      .where(eq(jeepneyRoutes.is_active, true));

    if (routes.length === 0) return [];

    const routeIds = routes.map((r) => r.route_id);
    const waypointRows = await db
      .select({
        routeId: routeWaypoints.route_id,
        label: routeWaypoints.label,
        sequence: routeWaypoints.sequence,
        isKeyStop: routeWaypoints.is_key_stop,
      })
      .from(routeWaypoints);

    const waypointsByRoute = new Map<string, typeof waypointRows>();
    for (const row of waypointRows) {
      if (!routeIds.includes(row.routeId)) continue;
      const list = waypointsByRoute.get(row.routeId) ?? [];
      list.push(row);
      waypointsByRoute.set(row.routeId, list);
    }

    return routes.map((r) => {
      const routeWaypointsForRoute = (
        waypointsByRoute.get(r.route_id) ?? []
      ).sort((a, b) => a.sequence - b.sequence);

      const keyStops = routeWaypointsForRoute
        .filter((w) => w.label && (w.isKeyStop ?? false))
        .map((w) => w.label as string);

      const firstLabel =
        routeWaypointsForRoute.find((w) => w.label)?.label ?? null;
      const lastLabel =
        [...routeWaypointsForRoute].reverse().find((w) => w.label)?.label ??
        null;

      return {
        routeId: r.route_id,
        routeCode: r.code,
        fromTerminal: firstLabel,
        toTerminal: lastLabel,
        keyStops,
      };
    });
  },

  /**
   * Fetch terminals within a rough bounding box (~2 km radius by default).
   * Uses a simple lat/lng delta approximation — sufficient for Calamba City scale.
   */
  async getNearbyTerminals(
    lat: number,
    lng: number,
    radiusKm = 2,
  ): Promise<TerminalContext[]> {
    // 1 degree lat ≈ 111 km; adjust lng for latitude
    const latDelta = radiusKm / 111;
    const lngDelta = radiusKm / (111 * Math.cos(lat * (Math.PI / 180)));

    const latMin = (lat - latDelta).toString();
    const latMax = (lat + latDelta).toString();
    const lngMin = (lng - lngDelta).toString();
    const lngMax = (lng + lngDelta).toString();

    const rows = await db
      .select({
        terminalId: terminals.terminal_id,
        terminalName: terminals.name,
        terminalLat: terminals.lat,
        terminalLng: terminals.lng,
        routeCode: jeepneyRoutes.code,
      })
      .from(terminals)
      .leftJoin(
        waitingSpots,
        eq(waitingSpots.terminal_id, terminals.terminal_id),
      )
      .leftJoin(
        jeepneyRoutes,
        eq(jeepneyRoutes.route_id, waitingSpots.route_id),
      )
      .where(
        and(
          gte(terminals.lat, latMin),
          lte(terminals.lat, latMax),
          gte(terminals.lng, lngMin),
          lte(terminals.lng, lngMax),
        ),
      );

    const terminalMap = new Map<string, TerminalContext>();

    for (const row of rows) {
      const existing = terminalMap.get(row.terminalId);
      if (!existing) {
        terminalMap.set(row.terminalId, {
          terminalId: row.terminalId,
          name: row.terminalName,
          lat: parseFloat(row.terminalLat),
          lng: parseFloat(row.terminalLng),
          routeCodes: row.routeCode ? [row.routeCode] : [],
        });
        continue;
      }

      if (row.routeCode && !existing.routeCodes.includes(row.routeCode)) {
        existing.routeCodes.push(row.routeCode);
      }
    }

    return Array.from(terminalMap.values());
  },
};
