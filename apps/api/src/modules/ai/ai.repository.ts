import { and, gte, lte, eq } from 'drizzle-orm';
import { db } from '../../db';
import { potholeZones } from '../../db/schema/pothole_zones';
import { hazardReports } from '../../db/schema/hazard_reports';
import { jeepneyRoutes } from '../../db/schema/jeepney_routes';
import { terminals } from '../../db/schema/terminals';
import {
  HazardZoneContext,
  RouteContext,
  TerminalContext,
} from './ai.types';

// ─── AI Repository ────────────────────────────────────────────────────────────
// Read-only. This repository builds context from other module tables
// to supply Gemini with accurate, Calamba-specific data.

export const aiRepository = {
  /**
   * Fetch a pothole zone + its linked hazard report for rerouting context.
   */
  async getHazardZoneById(zoneId: string): Promise<HazardZoneContext | null> {
    const zoneRows = await db
      .select()
      .from(potholeZones)
      .where(eq(potholeZones.zone_id, zoneId))
      .limit(1);

    if (!zoneRows[0]) return null;
    const zone = zoneRows[0];

    // Pull linked hazard report for type and severity details
    const reportRows = await db
      .select()
      .from(hazardReports)
      .where(eq(hazardReports.report_id, zone.report_id))
      .limit(1);

    const report = reportRows[0];

    return {
      zoneId: zone.zone_id,
      startLat: parseFloat(zone.start_lat),
      startLng: parseFloat(zone.start_lng),
      endLat: parseFloat(zone.end_lat),
      endLng: parseFloat(zone.end_lng),
      hazardType: report?.type ?? 'unknown',
      severity: 'medium', // Severity mapping from type if needed
      roadName: 'Unknown Road',
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

    return {
      routeId: r.route_id,
      routeCode: r.code,
      fromTerminal: 'Unknown',
      toTerminal: 'Unknown',
      keyStops: [],
    };
  },

  /**
   * Fetch all Calamba jeepney routes — used to give Gemini alternative options.
   */
  async getAllRoutes(): Promise<RouteContext[]> {
    const rows = await db
      .select()
      .from(jeepneyRoutes)
      .where(eq(jeepneyRoutes.is_active, true));
    
    return rows.map((r) => ({
      routeId: r.route_id,
      routeCode: r.code,
      fromTerminal: 'Unknown',
      toTerminal: 'Unknown',
      keyStops: [],
    }));
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
      .select()
      .from(terminals)
      .where(
        and(
          gte(terminals.lat, latMin),
          lte(terminals.lat, latMax),
          gte(terminals.lng, lngMin),
          lte(terminals.lng, lngMax),
        ),
      );

    return rows.map((t) => ({
      terminalId: t.terminal_id,
      name: t.name,
      lat: parseFloat(t.lat),
      lng: parseFloat(t.lng),
      routeCodes: [],
    }));
  },
};
