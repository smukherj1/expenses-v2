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
  desc,
  like,
  notLike,
  sql,
  count,
  type SQL,
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
import { aliasedColumn } from "./utils";

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

  // Conditions that select transactions across all pages matching
  // the parameters selected from the search bar.
  const allPagesConditions = allPagesConditionsFromOpts(opts);

  // Subquery to count the number of transactions matching the search
  // bar parameters across all pages.
  const countQ = db
    .select({ count: count().as("count") })
    .from(transactionsTable)
    .where(and(...allPagesConditions));
  const countSq = db.$with("countSq").as(countQ);

  // Build a subquery only containing transactions in the page as specified
  // by the cursors. If there are no cursors, we select the first page.
  const baseQ = db
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
  const pageSq = db.$with("pageSq").as(qWithLimit);

  // Subquery sorting the transactions in the selected page in ascending order
  // with sequence numbers.
  const pageAsc = db
    .with(pageSq)
    .select({
      id: pageSq.id,
      date: pageSq.date,
      desc: pageSq.desc,
      amountCents: pageSq.amountCents,
      institution: pageSq.institution,
      tag: pageSq.tag,
      ascSeqId:
        sql`ROW_NUMBER() OVER(ORDER BY ${pageSq.date} ASC, ${pageSq.id} ASC)`.as(
          "ascSeqId"
        ),
    })
    .from(pageSq)
    .orderBy(asc(pageSq.date), asc(pageSq.id));
  const pageAscSq = db.$with("pageAsc").as(pageAsc);

  // Subquery sorting the transactions in the selected page in descending order
  // with sequence numbers.
  const pageDesc = db
    .with(pageSq)
    .select({
      id: pageSq.id,
      date: pageSq.date,
      desc: pageSq.desc,
      amountCents: pageSq.amountCents,
      institution: pageSq.institution,
      tag: pageSq.tag,
      descSeqId:
        sql`ROW_NUMBER() OVER(ORDER BY ${pageSq.date} DESC, ${pageSq.id} DESC)`.as(
          "descSeqId"
        ),
    })
    .from(pageSq)
    .orderBy(desc(pageSq.date), desc(pageSq.id));
  const pageDescSq = db.$with("pageDesc").as(pageDesc);

  // Generate cursors for the next and previous pages from the transactions sorted
  // in ascending and descending order. The transaction with the highest (date, id)
  // is the "next" cursor. The transaction with the lowest (date, id) is the "prev"
  // cursor.
  const cursorsQ = db
    .with(pageDescSq, pageAscSq)
    .select({
      nextDate: aliasedColumn(pageDescSq.date, "nextDate"),
      nextId: aliasedColumn(pageDescSq.id, "nextId"),
      prevDate: aliasedColumn(pageAscSq.date, "prevDate"),
      prevId: aliasedColumn(pageAscSq.id, "prevId"),
    })
    .from(pageDescSq)
    .innerJoin(pageAscSq, eq(pageAscSq.ascSeqId, pageDescSq.descSeqId))
    .where(eq(pageAscSq.ascSeqId, 1))
    .limit(1);
  const cursorsSq = db.$with("cursors").as(cursorsQ);

  // In the final query to fetch the transactions, re-order them in ascending order
  // by date and id for a consistent display order in the web UI. This is needed
  // when displaying a "previous" page which would have sorted transactions in
  // descending order to find the page.
  const q = db
    .with(pageSq, countSq, cursorsSq)
    .select({
      id: pageSq.id,
      date: pageSq.date,
      desc: pageSq.desc,
      amountCents: pageSq.amountCents,
      institution: pageSq.institution,
      tag: pageSq.tag,
      totalPages: countSq.count,
      nextDate: cursorsSq.nextDate,
      nextId: cursorsSq.nextId,
      prevDate: cursorsSq.prevDate,
      prevId: cursorsSq.prevId,
    })
    .from(pageSq)
    .innerJoin(countSq, sql`true`)
    .innerJoin(cursorsSq, sql`true`)
    .orderBy(asc(pageSq.date), asc(pageSq.id));
  // console.log(
  //   `Running SQL: ${q.toSQL().sql} with params ${JSON.stringify(q.toSQL().params)}`
  // );
  const queryResult = await q;
  const txns = queryResult.map((t) => {
    return {
      id: t.id,
      date: new Date(t.date),
      description: t.desc,
      amount: (t.amountCents / 100).toFixed(2),
      institution: t.institution,
      tag: t.tag ? t.tag : undefined,
    };
  });
  const result: TxnsResult =
    queryResult.length > 0
      ? {
          txns,
          totalCount: queryResult[0]!.totalPages,
          prev: {
            date: new Date(queryResult[0]!.prevDate),
            id: queryResult[0]!.prevId,
          },
          next: {
            date: new Date(queryResult[0]!.nextDate),
            id: queryResult[0]!.nextId,
          },
        }
      : {
          txns,
          totalCount: 0,
        };
  console.log(
    `Fetched ${result.txns.length} transactions out of ${result.totalCount}.`
  );
  return result;
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
