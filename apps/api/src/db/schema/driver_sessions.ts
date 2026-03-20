import { pgTable, uuid, timestamp, boolean } from "drizzle-orm/pg-core";
import { users } from "./users";
import { jeepneyRoutes } from "./jeepney_routes";

export const driverSessions = pgTable("driver_sessions", {
  session_id: uuid("session_id").primaryKey().defaultRandom(),
  user_id: uuid("user_id")
    .references(() => users.user_id)
    .notNull(),
  route_id: uuid("route_id")
    .references(() => jeepneyRoutes.route_id)
    .notNull(),
  is_active: boolean("is_active").default(true).notNull(),
  started_at: timestamp("started_at").defaultNow().notNull(),
  ended_at: timestamp("ended_at"),
});
