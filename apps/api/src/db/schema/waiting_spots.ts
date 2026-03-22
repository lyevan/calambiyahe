import {
  pgTable,
  uuid,
  text,
  numeric,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { terminals } from "./terminals";
import { jeepneyRoutes } from "./jeepney_routes";

export const waitingSpots = pgTable("waiting_spots", {
  spot_id: uuid("spot_id").primaryKey().defaultRandom(),
  terminal_id: uuid("terminal_id")
    .references(() => terminals.terminal_id)
    .notNull(),
  route_id: uuid("route_id")
    .references(() => jeepneyRoutes.route_id)
    .notNull(),
  label: text("label").notNull(),
  lat: numeric("lat", { precision: 10, scale: 7 }).notNull(),
  lng: numeric("lng", { precision: 10, scale: 7 }).notNull(),
  status: text("status").default("pending"), // 'pending', 'confirmed', 'rejected'
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
});
