import { pgTable, uuid, integer, numeric, text, boolean } from "drizzle-orm/pg-core";
import { jeepneyRoutes } from "./jeepney_routes";

export const routeWaypoints = pgTable("route_waypoints", {
  waypoint_id: uuid("waypoint_id").primaryKey().defaultRandom(),
  route_id: uuid("route_id")
    .references(() => jeepneyRoutes.route_id)
    .notNull(),
  sequence: integer("sequence").notNull(),
  lat: numeric("lat", { precision: 10, scale: 7 }).notNull(),
  lng: numeric("lng", { precision: 10, scale: 7 }).notNull(),
  label: text("label"),
  is_key_stop: boolean("is_key_stop").default(false),
});
