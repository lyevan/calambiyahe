import { pgTable, uuid, numeric } from "drizzle-orm/pg-core";
import { hazardReports } from "./hazard_reports";

export const potholeZones = pgTable("pothole_zones", {
  zone_id: uuid("zone_id").primaryKey().defaultRandom(),
  report_id: uuid("report_id")
    .references(() => hazardReports.report_id)
    .notNull(),
  start_lat: numeric("start_lat", { precision: 10, scale: 7 }).notNull(),
  start_lng: numeric("start_lng", { precision: 10, scale: 7 }).notNull(),
  end_lat: numeric("end_lat", { precision: 10, scale: 7 }).notNull(),
  end_lng: numeric("end_lng", { precision: 10, scale: 7 }).notNull(),
});
