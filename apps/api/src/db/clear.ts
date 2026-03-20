import { db } from "./index";
import {
  users,
  jeepneyRoutes,
  routeWaypoints,
  gpsSignals,
  driverSessions,
  hazardReports,
  potholeZones,
  waitingSpots,
  terminals,
} from "./schema";
import { sql } from "drizzle-orm";

async function clear() {
  console.log("Clearing database...");

  // Delete in order of dependencies
  await db.delete(potholeZones);
  await db.delete(hazardReports);
  await db.delete(waitingSpots);
  await db.delete(gpsSignals);
  await db.delete(driverSessions);
  await db.delete(terminals);
  await db.delete(routeWaypoints);
  await db.delete(jeepneyRoutes);
  await db.delete(users);

  console.log("Database cleared successfully!");
  process.exit(0);
}

clear().catch((err) => {
  console.error("Clear failed:", err);
  process.exit(1);
});
