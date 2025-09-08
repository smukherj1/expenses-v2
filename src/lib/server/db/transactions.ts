import { db } from "./client";
import { transactionsTable } from "./schema";
import {
  and,
  asc,
  eq,
  gte,
  gt,
  lte,
  lt,
  or,
  SQL,
  desc,
  like,
  notLike,
} from "drizzle-orm";
import {
  NewTxn,
  GetTxnsOpts,
  TxnsResult,
  opInc,
  opGte,
  TxnCursor,
  Txn,
  opExc,
  opLte,
  opEq,
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

const DefaultGetTxnOpts = {
  pageSize: 0, // No page limit.
  from: new Date(0),
  to: () => {
    return CannonicalizeDate(new Date());
  },
};

export async function GetTxns(
  popts: Partial<GetTxnsOpts>
): Promise<TxnsResult> {
  const opts = validateOptsOrThrow(popts);

  const allPagesConditions = allPagesConditionsFromOpts(opts);
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
  const [totalCount, result] = await Promise.all([countQ, q]);
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
    pageSize: popts.pageSize || DefaultGetTxnOpts.pageSize,
    from: popts.from || DefaultGetTxnOpts.from,
    to: popts.to || DefaultGetTxnOpts.to(),
    desc: popts.desc,
    descOp: popts.descOp,
    amount: popts.amount,
    amountOp: popts.amountOp,
    inst: popts.inst,
    instOp: popts.instOp,
    prev: popts.prev,
    next: popts.next,
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

// Conditions that select transactions across all pages.
function allPagesConditionsFromOpts(opts: GetTxnsOpts): SQL[] {
  const result: SQL[] = [
    gte(transactionsTable.date, opts.from.getTime()),
    lte(transactionsTable.date, opts.to.getTime()),
  ];
  if (opts.desc && opts.descOp) {
    const desc = `%${opts.desc.toLowerCase()}%`;
    if (opts.descOp === opInc) {
      result.push(like(transactionsTable.desc, desc));
    } else if (opts.descOp === opExc) {
      result.push(notLike(transactionsTable.desc, desc));
    } else {
      console.error(`Ignoring unknown description match op: ${opts.descOp}`);
    }
  }

  if (opts.amount && opts.amountOp) {
    const amountCents = opts.amount * 100;
    if (opts.amountOp === opGte) {
      result.push(gte(transactionsTable.amountCents, amountCents));
    } else if (opts.amountOp === opLte) {
      result.push(lte(transactionsTable.amountCents, amountCents));
    } else if (opts.amountOp === opEq) {
      result.push(eq(transactionsTable.amountCents, amountCents));
    } else {
      console.error(`Ignoring unknown amount match op: ${opts.amountOp}`);
    }
  }

  if (opts.inst && opts.instOp) {
    const inst = `%${opts.inst.toLowerCase()}%`;
    if (opts.instOp === opInc) {
      result.push(like(transactionsTable.institution, inst));
    } else if (opts.instOp === opExc) {
      result.push(notLike(transactionsTable.institution, inst));
    } else {
      console.error(`Ignoring unknown institution match op: ${opts.instOp}`);
    }
  }
  return result;
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
