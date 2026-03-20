import { pgTable, uuid, numeric, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";

export const hazardReports = pgTable("hazard_reports", {
  report_id: uuid("report_id").primaryKey().defaultRandom(),
  reporter_id: uuid("reporter_id")
    .references(() => users.user_id)
    .notNull(),
  type: text("type").notNull(), // 'pothole', 'flood', 'accident', 'roadblock'
  description: text("description"),
  lat: numeric("lat", { precision: 10, scale: 7 }).notNull(),
  lng: numeric("lng", { precision: 10, scale: 7 }).notNull(),
  image_url: text("image_url"),
  status: text("status").default("pending"), // 'pending', 'verified', 'resolved'
  reported_at: timestamp("reported_at").defaultNow(),
});
