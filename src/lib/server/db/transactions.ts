import { db } from "./client";
import { transactionsTable } from "./schema";
import { and, asc, gte, lte } from "drizzle-orm";
import { Txn, GetTxnsOpts, TxnsResult, opInc, opGte } from "@/lib/transactions";

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

const DefaultGetTxnOpts: GetTxnsOpts = {
  from: new Date(0),
  to: new Date(),
  desc: "",
  descOp: opInc,
  amount: 0,
  amountOp: opGte,
  inst: "",
  instOp: opInc,
  pageSize: 0, // No page limit.
};

export async function GetTxns(
  popts: Partial<GetTxnsOpts>
): Promise<TxnsResult> {
  const opts: GetTxnsOpts = {
    from: popts.from || DefaultGetTxnOpts.from,
    to: popts.to || DefaultGetTxnOpts.to,
    desc: popts.desc || DefaultGetTxnOpts.desc,
    descOp: popts.descOp || DefaultGetTxnOpts.descOp,
    amount: popts.amount || DefaultGetTxnOpts.amount,
    amountOp: popts.amountOp || DefaultGetTxnOpts.amountOp,
    inst: popts.inst || DefaultGetTxnOpts.inst,
    instOp: popts.instOp || DefaultGetTxnOpts.instOp,
    pageSize: popts.pageSize || DefaultGetTxnOpts.pageSize,
    next: popts.next || DefaultGetTxnOpts.next,
  };
  console.log(
    `GetTxns(popts=${JSON.stringify(popts)}, opts=${JSON.stringify(opts)})`
  );
  if (opts.pageSize < 0) {
    throw new Error(
      `invalid pageSize given to GetTxns, got ${opts.pageSize}, want <= 0`
    );
  }
  let q = db
    .select()
    .from(transactionsTable)
    .where(
      and(
        gte(transactionsTable.date, opts.from.getTime()),
        lte(transactionsTable.date, opts.to.getTime()),
        opts.next ? gte(transactionsTable.id, opts.next.id) : undefined,
        opts.next
          ? gte(transactionsTable.date, opts.next.date.getTime())
          : undefined
      )
    )
    .orderBy(asc(transactionsTable.date), asc(transactionsTable.id));
  const limit = opts.pageSize > 0 ? opts.pageSize + 1 : undefined;
  const qWithLimit = limit ? q.limit(limit) : q;
  console.log(
    `Running SQL: ${qWithLimit.toSQL().sql} with params ${JSON.stringify(qWithLimit.toSQL().params)}`
  );
  const result = await qWithLimit;
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
