import { z } from "zod/v4";
import { DateAsString, DateFromString } from "./date";
export const NewTxnSchema = z.object({
  date: z.date(),
  description: z.string().max(200),
  amount: z
    .string()
    .max(10)
    .regex(/^-?\d+(?:\.\d{1,2})?$/, "Must be a valid monetary amount"),
  institution: z.string().max(50),
  tag: z.string().max(30).optional(),
});

const txnSchema = NewTxnSchema.extend({
  id: z.number(),
});

export type NewTxn = z.infer<typeof NewTxnSchema>;
export type Txn = z.infer<typeof txnSchema>;

export const GetTxnsSearchParamsSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  desc: z.string().optional(),
  descOp: z.string().optional(),
  amount: z.number().optional(),
  amountOp: z.string().optional(),
  inst: z.string().optional(),
  instOp: z.string().optional(),
  prevDate: z.string().optional(),
  prevID: z.string().optional(),
  nextDate: z.string().optional(),
  nextID: z.string().optional(),
  pageSize: z.number().optional(),
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
  pageSize: number;
  from: Date;
  to: Date;
  desc?: string;
  descOp?: StrOp;
  amount?: number;
  amountOp?: NumOp;
  inst?: string;
  instOp?: StrOp;
  next?: TxnCursor;
  prev?: TxnCursor;
}

export interface TxnsResult {
  txns: Txn[];
  totalCount: number;
  beforeCount: number;
  afterCount: number;
  prev?: TxnCursor;
  next?: TxnCursor;
}

export function GetTxnsSearchParamsToOpts(
  sp: GetTxnsSearchParams
): Partial<GetTxnsOpts> {
  const opts: Partial<GetTxnsOpts> = {};

  if (sp.from) {
    const d = DateFromString(sp.from);
    if (d) {
      opts.from = d;
    }
  }

  if (sp.to) {
    const d = DateFromString(sp.to);
    if (d) {
      opts.to = d;
    }
  }

  if (sp.desc) {
    opts.desc = sp.desc;
  }

  if (sp.descOp && (strOps as readonly string[]).includes(sp.descOp)) {
    opts.descOp = sp.descOp as StrOp;
  }

  if (sp.amount !== undefined) {
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

  if (sp.prevDate && sp.prevID) {
    const id = parseInt(sp.prevID, 10);
    const date = DateFromString(sp.prevDate);
    if (!isNaN(id) && date) {
      opts.prev = { date, id };
    }
  }

  if (sp.nextDate && sp.nextID) {
    const id = parseInt(sp.nextID, 10);
    const date = DateFromString(sp.nextDate);
    if (!isNaN(id) && date) {
      opts.next = { date, id };
    }
  }

  if (sp.pageSize) {
    opts.pageSize = sp.pageSize;
  }

  return opts;
}

export function GetTxnsOptsToSearchParams(
  opts: Partial<GetTxnsOpts>
): GetTxnsSearchParams {
  const sp: GetTxnsSearchParams = {};

  if (opts.from) {
    sp.from = DateAsString(opts.from);
  }

  if (opts.to) {
    sp.to = DateAsString(opts.to);
  }

  if (opts.desc) {
    sp.desc = opts.desc;
  }

  if (opts.descOp) {
    sp.descOp = opts.descOp;
  }

  if (opts.amount !== undefined) {
    sp.amount = opts.amount;
  }

  if (opts.amountOp) {
    sp.amountOp = opts.amountOp;
  }

  if (opts.inst) {
    sp.inst = opts.inst;
  }

  if (opts.instOp) {
    sp.instOp = opts.instOp;
  }

  if (opts.prev) {
    sp.prevDate = DateAsString(opts.prev.date);
    sp.prevID = String(opts.prev.id);
  }

  if (opts.next) {
    sp.nextDate = DateAsString(opts.next.date);
    sp.nextID = String(opts.next.id);
  }

  if (opts.pageSize) {
    sp.pageSize = opts.pageSize;
  }

  return sp;
}
