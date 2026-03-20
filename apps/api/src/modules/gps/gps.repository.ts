import { db } from "../../db";
import { gpsSignals, driverSessions } from "../../db/schema/index";
import { eq, and, gt, desc } from "drizzle-orm";

export const gpsRepository = {
  async saveSignal(data: typeof gpsSignals.$inferInsert) {
    const result = await db.insert(gpsSignals).values(data).returning();
    return result[0];
  },

  async getActiveSignalsByRoute(route_id: string, role?: string) {
    const now = new Date();
    let conditions = and(
      eq(gpsSignals.route_id, route_id),
      gt(gpsSignals.expires_at, now),
    );

    if (role) {
      conditions = and(conditions, eq(gpsSignals.role, role));
    }

    return await db.select().from(gpsSignals).where(conditions);
  },

  async deleteSignal(signal_id: string) {
    return await db
      .delete(gpsSignals)
      .where(eq(gpsSignals.signal_id, signal_id))
      .returning();
  },

  async endActiveDriverSession(user_id: string) {
    return await db
      .update(driverSessions)
      .set({ is_active: false, ended_at: new Date() })
      .where(
        and(
          eq(driverSessions.user_id, user_id),
          eq(driverSessions.is_active, true),
        ),
      )
      .returning();
  },

  async startDriverSession(user_id: string, route_id: string) {
    const result = await db
      .insert(driverSessions)
      .values({ user_id, route_id, is_active: true })
      .returning();
    return result[0];
  },

  async getActiveDriverSession(user_id: string) {
    const result = await db
      .select()
      .from(driverSessions)
      .where(
        and(
          eq(driverSessions.user_id, user_id),
          eq(driverSessions.is_active, true),
        ),
      )
      .orderBy(desc(driverSessions.started_at))
      .limit(1);

    return result[0] ?? null;
  },
};
