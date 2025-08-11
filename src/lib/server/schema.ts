import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";
export const usersTable = sqliteTable("transactions", {
  id: int().primaryKey({ autoIncrement: true }),
  date: int().notNull(),
  desc: text().notNull(),
  amountCents: int().notNull(),
  institution: text().notNull(),
  tag: text(),
});
