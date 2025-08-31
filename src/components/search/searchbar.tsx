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
import { Button } from "@/components/ui/button";
import {
  GetTxnsOpts,
  GetTxnsSearchParams,
  GetTxnsSearchParamsToOpts,
  StrOp,
  strOps,
  NumOp,
  numOps,
} from "@/lib/transactions";

export type Props = {
  txnSearchParams: GetTxnsSearchParams;
  onSearch: (opts: Partial<GetTxnsOpts>) => void;
};

export default function SearchBar({ txnSearchParams, onSearch }: Props) {
  const sopts = GetTxnsSearchParamsToOpts(txnSearchParams);

  const [from, setFrom] = React.useState(sopts.from);
  const [to, setTo] = React.useState(sopts.to);
  const [desc, setDesc] = React.useState(sopts.desc);
  const [descOp, setDescOp] = React.useState(sopts.descOp);
  const [amount, setAmount] = React.useState(sopts.amount);
  const [amountOp, setAmountOp] = React.useState(sopts.amountOp);
  const [inst, setInst] = React.useState(sopts.inst);
  const [instOp, setInstOp] = React.useState(sopts.instOp);

  const handleSearch = () => {
    console.log(`Requesting search`);
    onSearch({ from, to, desc, descOp, amount, amountOp, inst, instOp });
  };
  console.log(`Rendering SearchBar with props: ${JSON.stringify(sopts)}`);
  console.log(
    `Rendering SearchBar with state: from: ${from}, to: ${to}, desc: ${desc}, descOp: ${descOp}`
  );

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
      <Button onClick={() => handleSearch()}>Search</Button>
    </div>
  );
}
