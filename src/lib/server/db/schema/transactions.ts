import {
  pgTable,
  text,
  integer,
  serial,
  timestamp,
  index,
} from 'drizzle-orm/pg-core'

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
})

export const transactionsTable = pgTable(
  'transactions',
  {
    id: serial().primaryKey().notNull(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    date: timestamp().notNull(),
    desc: text().notNull(),
    amountCents: integer().notNull(),
    institution: text().notNull(),
    tag: text(),
  },
  (table) => [index('date_index').on(table.userId, table.date)],
)
