import { int, sqliteTable, text, index } from "drizzle-orm/sqlite-core";
export const transactionsTable = sqliteTable(
  "transactions",
  {
    id: int().primaryKey({ autoIncrement: true }),
    date: int().notNull(),
    desc: text().notNull(),
    amountCents: int().notNull(),
    institution: text().notNull(),
    tag: text(),
  },
  (table) => [index("date_index").on(table.date)]
);
