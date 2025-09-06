import { db } from "./client";
import { transactionsTable } from "./schema";
import { and, asc, eq, gte, gt, lte, or, SQL } from "drizzle-orm";
import {
  NewTxn,
  GetTxnsOpts,
  TxnsResult,
  opInc,
  opGte,
  TxnCursor,
} from "@/lib/transactions";
import { CannonicalizeDate } from "@/lib/date";

export async function UploadTxns(txns: NewTxn[]) {
  const result = await db.insert(transactionsTable).values(
    txns.map((t) => {
      return {
        date: CannonicalizeDate(t.date).getTime(),
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
    pageIndex: popts.pageIndex || DefaultGetTxnOpts.pageIndex,
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
  if (opts.pageIndex && opts.next) {
    throw new Error(
      `pageIndex=${opts.pageIndex} and next=${JSON.stringify(opts.next)} can't be specified at the same time, only one of them or neither must be specified when getting transactions`
    );
  }
  const baseConditions = [
    gte(transactionsTable.date, opts.from.getTime()),
    lte(transactionsTable.date, opts.to.getTime()),
  ];
  let countQ = db.$count(transactionsTable, and(...baseConditions));
  let baseQ = db
    .select()
    .from(transactionsTable)
    .where(and(...baseConditions, nextConditions(opts.next)))
    .orderBy(asc(transactionsTable.date), asc(transactionsTable.id));
  const limit = opts.pageSize > 0 ? opts.pageSize : undefined;
  const qWithLimit = limit ? baseQ.limit(limit) : baseQ;
  const q = qWithLimit.offset(
    opts.pageIndex && opts.pageSize > 0 ? opts.pageIndex * opts.pageIndex : 0
  );
  console.log(
    `Running SQL: ${q.toSQL().sql} with params ${JSON.stringify(q.toSQL().params)}`
  );
  const result = await q;
  const totalCount = await countQ;
  const txns = result.map((t) => {
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
    txns.length > 0 && txns.length < totalCount
      ? {
          date: txns.at(-1)!.date,
          id: txns.at(-1)!.id,
        }
      : undefined;
  console.log(
    `Fetched ${txns.length} transactions out of ${totalCount}, next id=${next ? next.id : "!"}, next date=${next ? next.date.getTime() : "!"} `
  );
  return {
    txns,
    totalCount,
    next,
  };
}

function nextConditions(next: TxnCursor | undefined): SQL | undefined {
  if (!next) {
    return;
  }
  return or(
    gt(transactionsTable.date, next.date.getTime()),
    and(
      eq(transactionsTable.date, next.date.getTime()),
      gt(transactionsTable.id, next.id)
    )
  );
}

export async function DeleteTxns() {
  const result = await db.delete(transactionsTable);
  return result.rowsAffected;
}
