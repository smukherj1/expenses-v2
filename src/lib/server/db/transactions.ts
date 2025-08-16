import { z } from "zod/v4";
import { db } from "./client";
import { transactionsTable } from "./schema";
import { and, asc, gte, lte } from "drizzle-orm";

export const TxnSchema = z.object({
  date: z.date(),
  description: z.string().max(256),
  amount: z
    .string()
    .max(10)
    .regex(/^-?\d+(?:\.\d{1,2})?$/, "Must be a valid monetary amount"),
  institution: z.string().max(50),
  tag: z.string().max(30).optional(),
});

export type Txn = z.infer<typeof TxnSchema>;

export async function UploadTxns(txns: Txn[]) {
  const result = await db.insert(transactionsTable).values(
    txns.map((t) => {
      return {
        date: t.date.getTime(),
        desc: t.description,
        amountCents: Math.round(parseFloat(t.amount) * 100),
        institution: t.institution,
        tag: t.tag,
      };
    })
  );
  return result.rowsAffected;
}

export async function GetTxns({
  from,
  to,
}: {
  from: Date;
  to: Date;
}): Promise<Txn[]> {
  console.log(`GetTxns(from=${from}, to=${to})`);
  const result = await db
    .select()
    .from(transactionsTable)
    .where(
      and(
        gte(transactionsTable.date, from.getTime()),
        lte(transactionsTable.date, to.getTime())
      )
    )
    .orderBy(asc(transactionsTable.date), asc(transactionsTable.id));
  return result.map((t) => {
    return {
      date: new Date(t.date),
      description: t.desc,
      amount: (t.amountCents / 100).toFixed(2),
      institution: t.institution,
      tag: t.tag ? t.tag : undefined,
    };
  });
}

export async function DeleteTxns() {
  const result = await db.delete(transactionsTable);
  return result.rowsAffected;
}
