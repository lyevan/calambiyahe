import { pgTable, uuid, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  user_id: uuid("user_id").primaryKey().defaultRandom(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull(), // 'commuter', 'driver', 'private_driver', 'citizen', 'guide', 'admin'
  is_admin: boolean("is_admin").default(false),
  created_at: timestamp("created_at").defaultNow(),
});
