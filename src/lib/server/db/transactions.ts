import { db } from "./client";
import { transactionsTable } from "./schema";
import { and, asc, eq, gte, gt, lte, lt, or, SQL, desc } from "drizzle-orm";
import {
  NewTxn,
  GetTxnsOpts,
  TxnsResult,
  opInc,
  opGte,
  TxnCursor,
  Txn,
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
  const opts = validateOptsOrThrow(popts);

  // Conditions that select transactions across all pages.
  const allPagesConditions = [
    gte(transactionsTable.date, opts.from.getTime()),
    lte(transactionsTable.date, opts.to.getTime()),
  ];
  let countQ = db.$count(transactionsTable, and(...allPagesConditions));
  let baseQ = db
    .select()
    .from(transactionsTable)
    .where(
      and(
        ...allPagesConditions,
        pageConditions({ prev: opts.prev, next: opts.next })
      )
    );

  const qWithOrder = opts.prev
    ? baseQ.orderBy(desc(transactionsTable.date), desc(transactionsTable.id))
    : baseQ.orderBy(asc(transactionsTable.date), asc(transactionsTable.id));

  const limit = opts.pageSize > 0 ? opts.pageSize : undefined;
  const qWithLimit = limit ? qWithOrder.limit(limit) : qWithOrder;

  const sq = db.$with("sq").as(qWithLimit);

  // In the final query to fetch the transactions, re-order them in ascending order
  // by date and id for a consistent display order in the web UI. This is needed
  // when displaying a "previous" page which would have sorted transactions in
  // descending order to find the page.
  const q = db.with(sq).select().from(sq).orderBy(asc(sq.date), asc(sq.id));
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
  console.log(`Fetched ${txns.length} transactions out of ${totalCount}.`);
  return {
    txns,
    totalCount,
    ...prevAndNextFromTxns(txns),
  };
}

function validateOptsOrThrow(popts: Partial<GetTxnsOpts>): GetTxnsOpts {
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
    prev: popts.prev || DefaultGetTxnOpts.prev,
    next: popts.next || DefaultGetTxnOpts.next,
  };
  if (opts.pageSize < 0) {
    throw new Error(
      `invalid pageSize given to GetTxns, got ${opts.pageSize}, want <= 0`
    );
  }
  if (opts.prev && opts.next) {
    throw new Error(
      `prev=${opts.prev} and next=${JSON.stringify(opts.next)} can't be specified at the same time, only one of them or neither must be specified when getting transactions`
    );
  }
  return opts;
}

function prevAndNextFromTxns(txns: Txn[]): {
  prev?: TxnCursor;
  next?: TxnCursor;
} {
  return txns.length > 0
    ? {
        prev: {
          date: txns.at(0)!.date,
          id: txns.at(0)!.id,
        },
        next: {
          date: txns.at(-1)!.date,
          id: txns.at(-1)!.id,
        },
      }
    : {};
}

function pageConditions({
  prev,
  next,
}: {
  prev?: TxnCursor;
  next?: TxnCursor;
}): SQL | undefined {
  if (next) {
    return or(
      gt(transactionsTable.date, next.date.getTime()),
      and(
        eq(transactionsTable.date, next.date.getTime()),
        gt(transactionsTable.id, next.id)
      )
    );
  }
  if (prev) {
    return or(
      lt(transactionsTable.date, prev.date.getTime()),
      and(
        eq(transactionsTable.date, prev.date.getTime()),
        lt(transactionsTable.id, prev.id)
      )
    );
  }
}

export async function DeleteTxns() {
  const result = await db.delete(transactionsTable);
  return result.rowsAffected;
}
