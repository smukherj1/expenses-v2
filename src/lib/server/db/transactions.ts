import { z } from "zod/v4";
import { db } from "./client";
import { transactionsTable } from "./schema";

export const TxnSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}\/\d{2}\/\d{2}$/, "Date must be in yyyy/mm/dd format")
    .pipe(z.coerce.date()),
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
