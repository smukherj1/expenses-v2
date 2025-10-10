import {
  pgTable,
  text,
  integer,
  serial,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { user } from "@/lib/server/db/schema/auth";

export const transactionsTable = pgTable(
  "transactions",
  {
    id: serial().primaryKey().notNull(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    date: timestamp().notNull(),
    desc: text().notNull(),
    amountCents: integer().notNull(),
    institution: text().notNull(),
    tag: text(),
  },
  (table) => [index("date_index").on(table.userId, table.date)]
);
