import { pgTable, uuid, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";

export const jeepneyRoutes = pgTable("jeepney_routes", {
  route_id: uuid("route_id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  is_active: boolean("is_active").default(true),
  created_by: uuid("created_by").references(() => users.user_id),
  created_at: timestamp("created_at").defaultNow(),
});
