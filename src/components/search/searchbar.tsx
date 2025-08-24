import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { z } from "zod";

import DatePicker from "@/components/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Route } from "@/routes/search";

const opInc = "~";
const opExc = "!~";
const opGte = ">=";
const opLte = "<=";
const opEq = "==";
const opNeq = "!=";

const strOps = [opInc, opExc] as const;
const numOps = [opGte, opLte, opEq, opNeq] as const;

type StrOp = (typeof strOps)[number];
type NumOp = (typeof numOps)[number];

const txnsSearchParamsSchema = z.object({
  from: z.string().optional().catch(undefined),
  to: z.string().optional().catch(undefined),
  desc: z.string().optional().catch(undefined),
  descOp: z.enum(strOps).optional().catch(undefined),
  amount: z.coerce.number().optional().catch(undefined),
  amountOp: z.enum(numOps).optional().catch(undefined),
});

type TxnSearchParams = z.infer<typeof txnsSearchParamsSchema>;

export default function SearchBar() {
  const navigate = useNavigate({ from: Route.fullPath });
  const searchParams = Route.useSearch();

  const [from, setFrom] = React.useState<Date | undefined>(
    searchParams.from ? new Date(searchParams.from) : undefined
  );
  const [to, setTo] = React.useState<Date | undefined>(
    searchParams.to ? new Date(search_params.to) : undefined
  );
  const [desc, setDesc] = React.useState(searchParams.desc ?? "");
  const [descOp, setDescOp] = React.useState<StrOp>(
    searchParams.descOp ?? opInc
  );
  const [amount, setAmount] = React.useState(searchParams.amount ?? "");
  const [amountOp, setAmountOp] = React.useState<NumOp>(
    searchParams.amountOp ?? opEq
  );

  const handleSearch = () => {
    const params: TxnSearchParams = {};
    if (from) params.from = from.toISOString().split("T")[0];
    if (to) params.to = to.toISOString().split("T")[0];
    if (desc) params.desc = desc;
    if (descOp) params.descOp = descOp;
    if (amount) params.amount = Number(amount);
    if (amountOp) params.amountOp = amountOp;

    navigate({
      to: "/search",
      search: params,
      replace: true,
    });
  };

  return (
    <div className="flex items-end gap-4 p-4 border rounded-lg">
      <div className="flex flex-col gap-2">
        <Label htmlFor="from-date">From</Label>
        <DatePicker id="from-date" date={from} setDate={setFrom} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="to-date">To</Label>
        <DatePicker id="to-date" date={to} setDate={setTo} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="desc">Description</Label>
        <div className="flex">
          <Select value={descOp} onValueChange={(v) => setDescOp(v as StrOp)}>
            <SelectTrigger className="w-24 rounded-r-none">
              <SelectValue placeholder="Op" />
            </SelectTrigger>
            <SelectContent>
              {strOps.map((op) => (
                <SelectItem key={op} value={op}>
                  {op}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            id="desc"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            className="rounded-l-none"
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="amount">Amount</Label>
        <div className="flex">
          <Select
            value={amountOp}
            onValueChange={(v) => setAmountOp(v as NumOp)}
          >
            <SelectTrigger className="w-24 rounded-r-none">
              <SelectValue placeholder="Op" />
            </SelectTrigger>
            <SelectContent>
              {numOps.map((op) => (
                <SelectItem key={op} value={op}>
                  {op}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="rounded-l-none"
          />
        </div>
      </div>
      <Button onClick={handleSearch}>Search</Button>
    </div>
  );
}