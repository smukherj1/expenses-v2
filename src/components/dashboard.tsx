import * as React from "react";
import TransactionsPieChart from "./transactions-pie-chart";
import {
  AggregateTxnTagYears,
  FilterTxnTagYears,
  SplitTxnsByFlow,
  TagsFromTxnsTagYears,
  TopTxnTagsByAmount,
  TopTxnTagsByCount,
  TxnsTagYear,
  YearsFromTxnsTagYears,
} from "@/lib/transactions";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DashboardProps {
  data: TxnsTagYear[];
}

export default function Dashboard({ data }: DashboardProps) {
  // First stage: Compute the unique years and tags the data covers.
  const [allYears, minYear, maxYear, allTags] = React.useMemo(() => {
    const allYears = YearsFromTxnsTagYears(data);
    const minYear = Math.min(...allYears);
    const maxYear = Math.max(...allYears);
    const allTags = TagsFromTxnsTagYears(data);
    return [allYears, minYear, maxYear, allTags];
  }, [data]);

  // Second stage: Based on the min and max years in the data, initialize
  // and update the state of the dropdowns selecting the from and to years
  // to display for the charts in the dashboard.
  const [fromYear, setFromYear] = React.useState<number>(minYear);
  const [toYear, setToYear] = React.useState<number>(maxYear);
  if (fromYear < minYear || fromYear > maxYear) {
    setFromYear(minYear);
  }
  if (toYear < minYear || toYear > maxYear) {
    setToYear(maxYear);
  }
  if (fromYear > toYear) {
    setFromYear(toYear);
  }

  const [inflow, outflow, allTxns] = React.useMemo(() => {
    const filteredData = FilterTxnTagYears(data, { fromYear, toYear });
    const allTxns = AggregateTxnTagYears(filteredData);
    const { inflow, outflow } = SplitTxnsByFlow(filteredData);
    const [agInflow, agOutFlow] = [
      AggregateTxnTagYears(inflow),
      AggregateTxnTagYears(outflow),
    ];
    return [
      TopTxnTagsByAmount(agInflow),
      TopTxnTagsByAmount(agOutFlow),
      TopTxnTagsByCount(allTxns),
    ];
  }, [data, fromYear, toYear]);

  return (
    <div>
      <div className="my-4 flex flex-row gap-4">
        <Select
          value={fromYear.toString()}
          onValueChange={(v) => setFromYear(parseInt(v, 10))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="From Year" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>From</SelectLabel>
              {Array.from(
                { length: toYear - minYear + 1 },
                (_, i) => minYear + i
              ).map((year) => (
                <SelectItem key={`from-${year}`} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Select
          value={toYear.toString()}
          onValueChange={(v) => setToYear(parseInt(v, 10))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="To Year" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>To</SelectLabel>
              {Array.from(
                { length: maxYear - fromYear + 1 },
                (_, i) => fromYear + i
              ).map((year) => (
                <SelectItem key={`to-${year}`} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <TransactionsPieChart
        title="All Transactions"
        dataKey="count"
        description="All your transactions broken down by tag"
        data={allTxns}
      />
      <TransactionsPieChart
        title="Expenses"
        dataKey="amount"
        description="Amount of money flowing out of your accounts broken down by tag"
        data={outflow}
      />
      <TransactionsPieChart
        title="Income"
        dataKey="amount"
        description="Amount of money flowing into your accounts broken down by tag"
        data={inflow}
      />
    </div>
  );
}
