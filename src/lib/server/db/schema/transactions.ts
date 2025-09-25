import { int, sqliteTable, text, index } from "drizzle-orm/sqlite-core";
import { user } from "@/lib/server/db/schema/auth";

export const transactionsTableV2 = sqliteTable(
  "transactionsV2",
  {
    id: int().primaryKey({ autoIncrement: true }),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    date: int().notNull(),
    desc: text().notNull(),
    amountCents: int().notNull(),
    institution: text().notNull(),
    tag: text(),
  },
  (table) => [index("date_indexV2").on(table.userId, table.date)]
);
