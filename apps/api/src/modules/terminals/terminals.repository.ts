import { db } from "../../db";
import { terminals, waitingSpots, jeepneyRoutes } from "../../db/schema";
import { eq, and } from "drizzle-orm";

export const terminalsRepository = {
  async createTerminal(data: typeof terminals.$inferInsert) {
    const result = await db.insert(terminals).values(data).returning();
    return result[0];
  },

  async listTerminals(statusFilter?: string) {
    if (statusFilter && statusFilter !== "all") {
      return await db.select().from(terminals).where(eq(terminals.status, statusFilter));
    }
    return await db.select().from(terminals);
  },

  async getTerminalById(terminal_id: string) {
    const result = await db
      .select()
      .from(terminals)
      .where(eq(terminals.terminal_id, terminal_id))
      .limit(1);

    return result[0] ?? null;
  },

  async updateTerminal(
    terminal_id: string,
    data: Partial<typeof terminals.$inferInsert>,
  ) {
    const result = await db
      .update(terminals)
      .set(data)
      .where(eq(terminals.terminal_id, terminal_id))
      .returning();

    return result[0] ?? null;
  },

  async deleteTerminal(terminal_id: string) {
    await db
      .delete(waitingSpots)
      .where(eq(waitingSpots.terminal_id, terminal_id));

    const result = await db
      .delete(terminals)
      .where(eq(terminals.terminal_id, terminal_id))
      .returning();

    return result[0] ?? null;
  },

  async listWaitingSpotsByTerminal(terminal_id: string, statusFilter?: string) {
    if (statusFilter && statusFilter !== "all") {
      return await db
        .select()
        .from(waitingSpots)
        .where(
          and(
            eq(waitingSpots.terminal_id, terminal_id),
            eq(waitingSpots.status, statusFilter)
          )
        );
    }
    return await db
      .select()
      .from(waitingSpots)
      .where(eq(waitingSpots.terminal_id, terminal_id));
  },

  async getAllWaitingSpots(statusFilter?: string) {
    if (statusFilter && statusFilter !== "all") {
      return await db.select().from(waitingSpots).where(eq(waitingSpots.status, statusFilter));
    }
    return await db.select().from(waitingSpots);
  },

  async createWaitingSpot(data: typeof waitingSpots.$inferInsert) {
    const result = await db.insert(waitingSpots).values(data).returning();
    return result[0];
  },

  async deleteWaitingSpot(spot_id: string) {
    const result = await db
      .delete(waitingSpots)
      .where(eq(waitingSpots.spot_id, spot_id))
      .returning();

    return result[0] ?? null;
  },

  async updateTerminalStatus(terminal_id: string, status: string) {
    const result = await db
      .update(terminals)
      .set({ status })
      .where(eq(terminals.terminal_id, terminal_id))
      .returning();

    return result[0] ?? null;
  },

  async updateWaitingSpotStatus(spot_id: string, status: string) {
    const result = await db
      .update(waitingSpots)
      .set({ status })
      .where(eq(waitingSpots.spot_id, spot_id))
      .returning();

    return result[0] ?? null;
  },

  async getRouteById(route_id: string) {
    const result = await db
      .select()
      .from(jeepneyRoutes)
      .where(eq(jeepneyRoutes.route_id, route_id))
      .limit(1);

    return result[0] ?? null;
  },
};
