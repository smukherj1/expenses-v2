import { db } from "./pg-client";
import { transactionsTable } from "./schema/transactions";
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
  inArray,
} from "drizzle-orm";
import {
  NewTxn,
  GetTxnsOpts,
  TxnsResult,
  opInc,
  opGte,
  TxnCursor,
  opExc,
  opLte,
  opEq,
  TxnsTagYearInst,
} from "@/lib/transactions";
import { CannonicalizeDate } from "@/lib/date";
import { aliasedColumn } from "./utils";
import { AuthSession } from "@/lib/auth";

export async function UploadTxns(session: AuthSession, txns: NewTxn[]) {
  const userId = userIdFromSession(session);
  const result = await db
    .insert(transactionsTable)
    .values(
      txns.map((t) => {
        return {
          userId: userId,
          date: CannonicalizeDate(t.date),
          desc: t.description,
          amountCents: Math.round(parseFloat(t.amount) * 100),
          institution: t.institution,
          tag: t.tag,
        };
      })
    )
    .returning({ id: transactionsTable.id });
  return result.length;
}

const DefaultGetTxnOpts = {
  pageSize: 0, // No page limit.
  from: new Date(0),
  to: () => {
    return CannonicalizeDate(new Date());
  },
};

interface fetchedTxn {
  id: number;
  date: Date;
  desc: string;
  amountCents: number;
  institution: string;
  tag: string | null;
  totalPages: number;
  nextDate: Date;
  nextId: number;
  prevDate: Date;
  prevId: number;
  beforeCount: number;
  afterCount: number;
}

export async function GetTxns(
  session: AuthSession,
  popts: Partial<GetTxnsOpts>
): Promise<TxnsResult> {
  const userId = userIdFromSession(session);
  const opts = validateOptsOrThrow(popts);
  const allPagesConditions = allPagesConditionsFromOpts(userId, opts);

  const countSq = buildCountSubquery(allPagesConditions);
  const pageSq = buildPageSubquery(opts, allPagesConditions);
  const cursorsSq = buildCursorsSubquery(pageSq);
  const beforeAfterSq = countTxnsBeforeAndAfterSubquery(
    cursorsSq,
    allPagesConditions
  );

  // In the final query to fetch the transactions, re-order them in ascending order
  // by date and id for a consistent display order in the web UI. This is needed
  // when displaying a "previous" page which would have sorted transactions in
  // descending order to find the page.
  const q = db
    .with(pageSq, countSq, cursorsSq, beforeAfterSq)
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
      beforeCount: beforeAfterSq.beforeCount,
      afterCount: beforeAfterSq.afterCount,
    })
    .from(pageSq)
    .innerJoin(countSq, sql`true`)
    .innerJoin(cursorsSq, sql`true`)
    .innerJoin(beforeAfterSq, sql`true`)
    .orderBy(asc(pageSq.date), asc(pageSq.id));

  const queryResult = await q;
  const result = toTxnResults(queryResult);
  return result;
}

function buildCountSubquery(allPagesConditions: SQL[]) {
  // Subquery to count the number of transactions matching the search
  // bar parameters across all pages.
  const countQ = db
    .select({ count: count().as("count") })
    .from(transactionsTable)
    .where(and(...allPagesConditions));
  return db.$with("countSq").as(countQ);
}

function buildPageSubquery(opts: GetTxnsOpts, allPagesConditions: SQL[]) {
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
  return db.$with("pageSq").as(qWithLimit);
}

function buildCursorsSubquery(pageSq: ReturnType<typeof buildPageSubquery>) {
  // Subquery sorting the transactions in the selected page in ascending order
  // with sequence numbers.
  const pageAsc = db
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
  const pageAscSq = db.$with("pageAscSq").as(pageAsc);

  const pageDesc = db
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
  const pageDescSq = db.$with("pageDescSq").as(pageDesc);

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
  return db.$with("cursorsSq").as(cursorsQ);
}

// Builds a subquery that counts the transactions before and after the
// page selected by the given cursor subquery.
function countTxnsBeforeAndAfterSubquery(
  cursorsSq: ReturnType<typeof buildCursorsSubquery>,
  pageConditions: SQL[]
) {
  const beforeQ = db
    .select({
      beforeCount: count().as("beforeCount"),
    })
    .from(transactionsTable)
    .innerJoin(cursorsSq, sql`true`)
    .where(
      and(
        ...pageConditions,
        or(
          lt(transactionsTable.date, cursorsSq.prevDate),
          and(
            eq(transactionsTable.date, cursorsSq.prevDate),
            lt(transactionsTable.id, cursorsSq.prevId)
          )
        )
      )
    );
  const beforeSq = db.$with("beforeSq").as(beforeQ);

  const afterQ = db
    .select({
      afterCount: count().as("afterCount"),
    })
    .from(transactionsTable)
    .innerJoin(cursorsSq, sql`true`)
    .where(
      and(
        ...pageConditions,
        or(
          gt(transactionsTable.date, cursorsSq.nextDate),
          and(
            eq(transactionsTable.date, cursorsSq.nextDate),
            gt(transactionsTable.id, cursorsSq.nextId)
          )
        )
      )
    );
  const afterSq = db.$with("afterSq").as(afterQ);

  const beforeAfterQ = db
    .with(beforeSq, afterSq)
    .select({
      beforeCount: beforeSq.beforeCount,
      afterCount: afterSq.afterCount,
    })
    .from(beforeSq)
    .innerJoin(afterSq, sql`true`);
  return db.$with("beforeAfterSq").as(beforeAfterQ);
}

function toTxnResults(queryResult: fetchedTxn[]): TxnsResult {
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
          beforeCount: queryResult[0]!.beforeCount,
          afterCount: queryResult[0]!.afterCount,
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
          beforeCount: 0,
          afterCount: 0,
        };
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
function allPagesConditionsFromOpts(userId: string, opts: GetTxnsOpts): SQL[] {
  const result: SQL[] = [
    eq(transactionsTable.userId, userId),
    gte(transactionsTable.date, opts.from),
    lte(transactionsTable.date, opts.to),
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
      gt(transactionsTable.date, next.date),
      and(
        eq(transactionsTable.date, next.date),
        gt(transactionsTable.id, next.id)
      )
    );
  }
  if (prev) {
    return or(
      lt(transactionsTable.date, prev.date),
      and(
        eq(transactionsTable.date, prev.date),
        lt(transactionsTable.id, prev.id)
      )
    );
  }
}

export async function DeleteTxns(session: AuthSession) {
  const userId = userIdFromSession(session);
  const result = await db
    .delete(transactionsTable)
    .where(eq(transactionsTable.userId, userId))
    .returning({ id: transactionsTable.id });
  return result.length;
}

export const UpdateTxnsTag = async ({
  session,
  txnIds,
  tag,
}: {
  session: AuthSession;
  txnIds: number[];
  tag: string | null;
}) => {
  const userId = userIdFromSession(session);
  await db
    .update(transactionsTable)
    .set({ tag: tag })
    .where(
      and(
        eq(transactionsTable.userId, userId),
        inArray(transactionsTable.id, txnIds)
      )
    );
};

function userIdFromSession(s: AuthSession): string {
  if (s === null) {
    throw new Error("unauthenticated: permission denied");
  }
  return s.session.userId;
}

export async function GetTxnsByYearAndTag(
  session: AuthSession
): Promise<TxnsTagYearInst[]> {
  const userId = userIdFromSession(session);
  const result = await db
    .select({
      year: sql<number>`CAST(EXTRACT(YEAR FROM ${transactionsTable.date}) AS INT)`.as(
        "year"
      ),
      institution: transactionsTable.institution,
      tag: transactionsTable.tag,
      amount: sql<number>`CAST(sum(${transactionsTable.amountCents}) / 100.0 AS INT)`,
      count: count().as("count"),
    })
    .from(transactionsTable)
    .where(eq(transactionsTable.userId, userId))
    .groupBy(sql`year`, transactionsTable.institution, transactionsTable.tag);
  return result;
}
