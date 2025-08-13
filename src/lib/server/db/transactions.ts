import { z } from "zod";
import { db } from "./client";
import { transactionsTable } from "./schema";

export const TxnSchema = z.object({
  date: z.date(),
  desc: z.string().max(50),
  amount: z
    .string()
    .max(10)
    .regex(/^-?\d+(?:\.\d{2})?$/, "Must be a valid monetary amount"),
  institution: z.string().max(50),
  tag: z.string().max(30).optional(),
});

export type Txn = z.infer<typeof TxnSchema>;

export function UploadTxns(txns: Txn[]) {
  db.insert(transactionsTable).values(
    txns.map((t) => {
      return {
        date: t.date.getTime(),
        desc: t.desc,
        amountCents: parseInt(t.amount) * 100,
        institution: t.institution,
        tag: t.tag,
      };
    })
  );
}
