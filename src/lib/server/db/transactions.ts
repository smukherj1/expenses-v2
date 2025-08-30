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

const GetTxnsSearchParamsSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  desc: z.string().optional(),
  descOp: z.string().optional(),
  amount: z.string().optional(),
  amountOp: z.string().optional(),
  inst: z.string().optional(),
  instOp: z.string().optional(),
  nextDate: z.string().optional(),
  nextID: z.string().optional(),
});

export type GetTxnsSearchParams = z.infer<typeof GetTxnsSearchParamsSchema>;

export const opInc = "~";
export const opExc = "!~";
export const opGte = ">=";
export const opLte = "<=";
export const opEq = "==";
export const opNeq = "!=";

export const strOps = [opInc, opExc] as const;
export const numOps = [opGte, opLte, opEq, opNeq] as const;

export type StrOp = (typeof strOps)[number];
export type NumOp = (typeof numOps)[number];

export interface TxnCursor {
  date: Date;
  id: number;
}

export interface GetTxnsOpts {
  from: Date;
  to: Date;
  desc: string;
  descOp: StrOp;
  amount: number;
  amountOp: NumOp;
  inst: string;
  instOp: StrOp;
  pageSize: number;
  next?: TxnCursor;
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

export interface TxnsResult {
  txns: Txn[];
  next?: TxnCursor;
}

export function GetTxnsSearchParamsToOpts(
  sp: GetTxnsSearchParams
): Partial<GetTxnsOpts> {
  const opts: Partial<GetTxnsOpts> = {};

  if (sp.from) {
    const d = new Date(sp.from);
    if (!isNaN(d.getTime())) {
      opts.from = d;
    }
  }

  if (sp.to) {
    const d = new Date(sp.to);
    if (!isNaN(d.getTime())) {
      opts.to = d;
    }
  }

  if (sp.desc) {
    opts.desc = sp.desc;
  }

  if (sp.descOp && (strOps as readonly string[]).includes(sp.descOp)) {
    opts.descOp = sp.descOp as StrOp;
  }

  if (sp.amount && typeof sp.amount === "string") {
    const amount = parseFloat(sp.amount);
    if (!isNaN(amount)) {
      opts.amount = amount;
    }
  } else if (typeof sp.amount === "number") {
    opts.amount = sp.amount;
  }

  if (sp.amountOp && (numOps as readonly string[]).includes(sp.amountOp)) {
    opts.amountOp = sp.amountOp as NumOp;
  }

  if (sp.inst) {
    opts.inst = sp.inst;
  }

  if (sp.instOp && (strOps as readonly string[]).includes(sp.instOp)) {
    opts.instOp = sp.instOp as StrOp;
  }

  if (sp.nextDate && sp.nextID) {
    const id = parseInt(sp.nextID, 10);
    const date = new Date(sp.nextDate);
    if (!isNaN(id) && !isNaN(date.getTime())) {
      opts.next = { date, id };
    }
  }

  return opts;
}

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
