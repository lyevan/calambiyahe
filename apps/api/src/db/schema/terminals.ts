import { pgTable, uuid, text, numeric, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";

export const terminals = pgTable("terminals", {
  terminal_id: uuid("terminal_id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  lat: numeric("lat", { precision: 10, scale: 7 }).notNull(),
  lng: numeric("lng", { precision: 10, scale: 7 }).notNull(),
  address: text("address"),
  status: text("status").default("pending"), // 'pending', 'confirmed', 'rejected'
  created_by: uuid("created_by").references(() => users.user_id),
  created_at: timestamp("created_at").defaultNow(),
});
