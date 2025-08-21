import { z } from "zod/v4";
import { db } from "./client";
import { transactionsTable } from "./schema";
import { and, asc, gte, lte } from "drizzle-orm";

export const TxnSchema = z.object({
  date: z.date(),
  description: z.string().max(200),
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

export interface TxnCursor {
  date: Date;
  id: number;
}

export interface GetTxnsOpts {
  from: Date;
  to: Date;
  pageSize: number;
  next?: TxnCursor;
}

const DefaultGetTxnOpts: GetTxnsOpts = {
  from: new Date(0),
  to: new Date(),
  pageSize: 0, // No page limit.
};

export interface TxnsResult {
  txns: Txn[];
  next?: TxnCursor;
}

export async function GetTxns(
  popts: Partial<GetTxnsOpts>
): Promise<TxnsResult> {
  const opts: GetTxnsOpts = {
    from: popts.from || DefaultGetTxnOpts.from,
    to: popts.to || DefaultGetTxnOpts.to,
    pageSize: popts.pageSize || DefaultGetTxnOpts.pageSize,
    next: popts.next || DefaultGetTxnOpts.next,
  };
  if (opts.pageSize < 0) {
    throw new Error(
      `invalid pageSize given to GetTxns, got ${opts.pageSize}, want <= 0`
    );
  }
  if (opts.pageSize > 1000) {
    opts.pageSize = 1000;
  }
  let q = db
    .select()
    .from(transactionsTable)
    .where(
      and(
        gte(transactionsTable.date, opts.from.getTime()),
        lte(transactionsTable.date, opts.to.getTime())
      )
    )
    .orderBy(asc(transactionsTable.date), asc(transactionsTable.id));
  const limit = opts.pageSize > 0 ? opts.pageSize + 1 : undefined;
  const result = await (limit ? q.limit(limit) : q);
  const fetched_txns = result.map((t) => {
    return {
      id: t.id,
      date: new Date(t.date),
      description: t.desc,
      amount: (t.amountCents / 100).toFixed(2),
      institution: t.institution,
      tag: t.tag ? t.tag : undefined,
    };
  });
  const next =
    limit && fetched_txns.length === limit
      ? {
          date: fetched_txns.at(-1)!.date,
          id: fetched_txns.at(-1)!.id,
        }
      : undefined;
  const txns =
    limit && fetched_txns.length === limit
      ? fetched_txns.slice(0, limit - 1)
      : fetched_txns;
  return {
    txns,
    next,
  };
}

export async function DeleteTxns() {
  const result = await db.delete(transactionsTable);
  return result.rowsAffected;
}
