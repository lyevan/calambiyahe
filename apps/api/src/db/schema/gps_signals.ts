import { pgTable, uuid, numeric, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";
import { jeepneyRoutes } from "./jeepney_routes";

export const gpsSignals = pgTable("gps_signals", {
  signal_id: uuid("signal_id").primaryKey().defaultRandom(),
  user_id: uuid("user_id")
    .references(() => users.user_id)
    .notNull(),
  route_id: uuid("route_id")
    .references(() => jeepneyRoutes.route_id)
    .notNull(),
  lat: numeric("lat", { precision: 10, scale: 7 }).notNull(),
  lng: numeric("lng", { precision: 10, scale: 7 }).notNull(),
  role: text("role").notNull(), // 'commuter' | 'driver'
  emitted_at: timestamp("emitted_at").defaultNow(),
  expires_at: timestamp("expires_at").notNull(),
});
