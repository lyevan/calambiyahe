import { db } from "../../db";
import { users } from "../../db/schema";
import { eq } from "drizzle-orm";

export const usersRepository = {
  async getById(user_id: string) {
    const result = await db
      .select({
        user_id: users.user_id,
        username: users.username,
        role: users.role,
        is_admin: users.is_admin,
        created_at: users.created_at,
      })
      .from(users)
      .where(eq(users.user_id, user_id))
      .limit(1);

    return result[0] ?? null;
  },

  async getByUsername(username: string) {
    const result = await db
      .select({
        user_id: users.user_id,
      })
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    return result[0] ?? null;
  },

  async listUsers() {
    return await db
      .select({
        user_id: users.user_id,
        username: users.username,
        role: users.role,
        is_admin: users.is_admin,
        created_at: users.created_at,
      })
      .from(users);
  },

  async updateProfile(user_id: string, data: { username?: string }) {
    const result = await db
      .update(users)
      .set(data)
      .where(eq(users.user_id, user_id))
      .returning({
        user_id: users.user_id,
        username: users.username,
        role: users.role,
        is_admin: users.is_admin,
        created_at: users.created_at,
      });

    return result[0] ?? null;
  },

  async updateUserRole(user_id: string, role: "commuter" | "driver" | "admin") {
    const result = await db
      .update(users)
      .set({ role, is_admin: role === "admin" })
      .where(eq(users.user_id, user_id))
      .returning({
        user_id: users.user_id,
        username: users.username,
        role: users.role,
        is_admin: users.is_admin,
        created_at: users.created_at,
      });

    return result[0] ?? null;
  },
};
