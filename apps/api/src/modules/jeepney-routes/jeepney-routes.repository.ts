import { db } from "../../db";
import { jeepneyRoutes, routeWaypoints } from "../../db/schema/index";
import { eq, asc } from "drizzle-orm";

export const routesRepository = {
  async createRoute(data: typeof jeepneyRoutes.$inferInsert) {
    const result = await db.insert(jeepneyRoutes).values(data).returning();
    return result[0];
  },

  async getAllRoutes(onlyActive = false) {
    const query = db.select().from(jeepneyRoutes);
    if (onlyActive) {
      return await query.where(eq(jeepneyRoutes.is_active, true));
    }
    return await query;
  },

  async getRouteById(id: string) {
    const route = await db
      .select()
      .from(jeepneyRoutes)
      .where(eq(jeepneyRoutes.route_id, id))
      .limit(1);

    if (!route[0]) return null;

    const waypoints = await db
      .select()
      .from(routeWaypoints)
      .where(eq(routeWaypoints.route_id, id))
      .orderBy(asc(routeWaypoints.sequence));

    return { ...route[0], waypoints };
  },

  async updateRoute(
    id: string,
    data: Partial<typeof jeepneyRoutes.$inferInsert>,
  ) {
    const result = await db
      .update(jeepneyRoutes)
      .set(data)
      .where(eq(jeepneyRoutes.route_id, id))
      .returning();
    return result[0];
  },

  async deleteRoute(id: string) {
    await db.delete(routeWaypoints).where(eq(routeWaypoints.route_id, id));
    return await db
      .delete(jeepneyRoutes)
      .where(eq(jeepneyRoutes.route_id, id))
      .returning();
  },

  async replaceWaypoints(
    route_id: string,
    waypoints: (typeof routeWaypoints.$inferInsert)[],
  ) {
    await db
      .delete(routeWaypoints)
      .where(eq(routeWaypoints.route_id, route_id));
    return await db.insert(routeWaypoints).values(waypoints).returning();
  },

  async addWaypoint(data: typeof routeWaypoints.$inferInsert) {
    const result = await db.insert(routeWaypoints).values(data).returning();
    return result[0];
  },

  async getWaypointById(waypoint_id: string) {
    const result = await db
      .select()
      .from(routeWaypoints)
      .where(eq(routeWaypoints.waypoint_id, waypoint_id))
      .limit(1);
    return result[0] ?? null;
  },

  async getWaypointsByRoute(route_id: string) {
    return await db
      .select()
      .from(routeWaypoints)
      .where(eq(routeWaypoints.route_id, route_id))
      .orderBy(asc(routeWaypoints.sequence));
  },

  async deleteWaypoint(waypoint_id: string) {
    return await db
      .delete(routeWaypoints)
      .where(eq(routeWaypoints.waypoint_id, waypoint_id))
      .returning();
  },

  async updateWaypointSequence(waypoint_id: string, sequence: number) {
    return await db
      .update(routeWaypoints)
      .set({ sequence })
      .where(eq(routeWaypoints.waypoint_id, waypoint_id))
      .returning();
  },
};
