import { db } from "./index";
import { jeepneyRoutes, routeWaypoints, users } from "./schema";
import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";

async function seed() {
  console.log("Seeding started...");

  // 1. Create an admin user for seeding (idempotent)
  let admin = (
    await db
      .select({ user_id: users.user_id })
      .from(users)
      .where(eq(users.username, "admin"))
      .limit(1)
  )[0];

  if (!admin) {
    const adminPassword = await bcrypt.hash("admin123", 10);
    [admin] = await db
      .insert(users)
      .values({
        username: "admin",
        password: adminPassword,
        role: "admin",
        is_admin: true,
      })
      .returning({ user_id: users.user_id });

    console.log("Seeded admin user");
  } else {
    console.log("Admin user already exists, skipping");
  }

  const routes = [
    { code: "CAL-01", name: "Crossing → Parian" },
    { code: "CAL-02", name: "Crossing → Bucal" },
    { code: "CAL-03", name: "Crossing → Turbina" },
    { code: "CAL-04", name: "Calamba → Los Baños" },
    { code: "CAL-05", name: "Calamba → Sta. Rosa" },
    { code: "CAL-06", name: "Crossing → SM Calamba" },
    { code: "CAL-07", name: "Crossing → Canlubang" },
  ];

  for (const routeData of routes) {
    let route = (
      await db
        .select({ route_id: jeepneyRoutes.route_id, code: jeepneyRoutes.code })
        .from(jeepneyRoutes)
        .where(eq(jeepneyRoutes.code, routeData.code))
        .limit(1)
    )[0];

    if (!route) {
      [route] = await db
        .insert(jeepneyRoutes)
        .values({
          ...routeData,
          created_by: admin.user_id,
        })
        .returning({
          route_id: jeepneyRoutes.route_id,
          code: jeepneyRoutes.code,
        });

      console.log(`Seeded route: ${routeData.code}`);
    } else {
      console.log(
        `Route already exists: ${routeData.code}, skipping route insert`,
      );
    }

    const existingStartWaypoint = (
      await db
        .select({ waypoint_id: routeWaypoints.waypoint_id })
        .from(routeWaypoints)
        .where(
          and(
            eq(routeWaypoints.route_id, route.route_id),
            eq(routeWaypoints.sequence, 1),
          ),
        )
        .limit(1)
    )[0];

    if (!existingStartWaypoint) {
      await db.insert(routeWaypoints).values({
        route_id: route.route_id,
        sequence: 1,
        lat: "14.2116",
        lng: "121.1653",
        label: "Crossing Terminal",
        is_key_stop: true,
      });
      console.log(`Seeded default waypoint for: ${routeData.code}`);
    }
  }

  console.log("Seeding completed successfully!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
