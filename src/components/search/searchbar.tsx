import * as React from "react";
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
import {
  GetTxnsSearchParamsToOpts,
  opInc,
  opGte,
  StrOp,
  strOps,
  NumOp,
  numOps,
} from "@/lib/transactions";
import { useDebouncedCallback } from "use-debounce";
import { cn } from "@/lib/utils";
import { DateAsString } from "@/lib/date";

export interface SearchBarParams {
  from?: string;
  to?: string;
  desc?: string;
  descOp?: string;
  amount?: string;
  amountOp?: string;
  inst?: string;
  instOp?: string;
}

export type Props = {
  params: SearchBarParams;
  onParamsChange: (newParams: SearchBarParams) => void;
  className?: string;
};

export default function SearchBar({
  params,
  onParamsChange,
  className,
}: Props) {
  const sopts = GetTxnsSearchParamsToOpts(params);

  const [from, setFrom] = React.useState(sopts.from);
  const [to, setTo] = React.useState(sopts.to);
  const [desc, setDesc] = React.useState(sopts.desc);
  const [descOp, setDescOp] = React.useState<StrOp>(sopts.descOp || opInc);
  const [amount, setAmount] = React.useState(sopts.amount);
  const [amountOp, setAmountOp] = React.useState<NumOp>(
    sopts.amountOp || opGte
  );
  const [inst, setInst] = React.useState(sopts.inst);
  const [instOp, setInstOp] = React.useState<StrOp>(sopts.instOp || opInc);

  const debouncedSearch = useDebouncedCallback(() => {
    onParamsChange({
      from: from ? DateAsString(from) : undefined,
      to: to ? DateAsString(to) : undefined,
      desc,
      descOp,
      amount: amount ? String(amount) : undefined,
      amountOp,
      inst,
      instOp,
    });
  }, 300);
  const isInitialMount = React.useRef(true);
  React.useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    debouncedSearch();
  }, [from, to, desc, descOp, amount, amountOp, inst, instOp, debouncedSearch]);

  return (
    <div
      className={cn(
        "flex flex-row items-center gap-4 p-4 rounded-xl border border-neutral-700 bg-neutral-900 shadow-2xl shadow-neutral-950",
        className
      )}
    >
      <Label className="text-lg mx-4 font-bold text-neutral-100">
        Search for transactions
      </Label>
      <div className="flex flex-1 flex-row justify-center items-center gap-4">
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
              value={desc ?? ""}
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
              value={amount ?? ""}
              onChange={(e) => {
                const num = parseFloat(e.target.value);
                setAmount(isNaN(num) ? undefined : num);
              }}
              className="rounded-l-none"
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="inst">Institution</Label>
          <div className="flex">
            <Select value={instOp} onValueChange={(v) => setInstOp(v as StrOp)}>
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
              id="inst"
              value={inst ?? ""}
              onChange={(e) => setInst(e.target.value)}
              className="rounded-l-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
