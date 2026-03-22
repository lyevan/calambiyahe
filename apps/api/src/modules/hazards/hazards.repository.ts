import { db } from "../../db";
import { hazardReports, potholeZones } from "../../db/schema/index";
import { eq } from "drizzle-orm";

export const hazardsRepository = {
  async createReport(data: typeof hazardReports.$inferInsert) {
    const result = await db.insert(hazardReports).values(data).returning();
    return result[0];
  },

  async getAllReports(statusFilter?: string) {
    if (statusFilter && statusFilter !== "all") {
      return await db.select().from(hazardReports).where(eq(hazardReports.status, statusFilter));
    }
    return await db.select().from(hazardReports);
  },

  async getReportById(id: string) {
    const report = await db
      .select()
      .from(hazardReports)
      .where(eq(hazardReports.report_id, id))
      .limit(1);
    return report[0];
  },

  async updateReport(id: string, data: Partial<typeof hazardReports.$inferInsert>) {
    const result = await db
      .update(hazardReports)
      .set(data)
      .where(eq(hazardReports.report_id, id))
      .returning();
    return result[0];
  },

  async createPotholeZone(data: typeof potholeZones.$inferInsert) {
    const result = await db.insert(potholeZones).values(data).returning();
    return result[0];
  },

  async getPotholeZones() {
    return await db.select().from(potholeZones);
  },
  async deleteReport(id: string) {
    return await db
      .delete(hazardReports)
      .where(eq(hazardReports.report_id, id))
      .returning();
  },
};
