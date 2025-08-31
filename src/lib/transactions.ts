import { z } from "zod/v4";
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

export const GetTxnsSearchParamsSchema = z.object({
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
