import { db } from "../../db";
import { users } from "../../db/schema/index";
import { eq } from "drizzle-orm";

export const authRepository = {
  async findUserByUsername(username: string) {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);
    return result[0];
  },

  async createUser(data: typeof users.$inferInsert) {
    const result = await db.insert(users).values(data).returning();
    return result[0];
  },
};
