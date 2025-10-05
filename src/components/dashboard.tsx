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
import { Label } from "@/components/ui/label";
import MultiSelect from "./multi-select";

interface Props {
  data: TxnsTagYear[];
}

export default function Dashboard({ data }: Props) {
  // First stage: Compute the unique years and tags the data covers.
  const [minYear, maxYear] = React.useMemo(() => {
    const allYears = YearsFromTxnsTagYears(data);
    const minYear = Math.min(...allYears);
    const maxYear = Math.max(...allYears);

    return [minYear, maxYear];
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

  // Third stage: Filter the data based on the from and two years selected
  // above and also compute all unique tags present in the filtered data.
  const [yearFilteredData, tags] = React.useMemo(() => {
    const filtered = FilterTxnTagYears(data, { fromYear, toYear });
    const tags = TagsFromTxnsTagYears(filtered);
    return [filtered, tags];
  }, [data, fromYear, toYear]);

  // Fourth stage: Based on the data filtered to the range of years selected
  // by the user in the UI, initialize and update the state of the dropdowns
  // selecting the tags to display for the charts in the dashboard.
  const [selectedTags, setSelectedTags] =
    React.useState<(string | null)[]>(tags);

  // If the computed list of tags changed, e.g, due to selecting a range of years,
  // update the selection tags back to selecting all the new set of tags.
  React.useEffect(() => {
    setSelectedTags(tags);
  }, [tags]);

  // Fifth stage: Filter the data based on the tags selected by the user in the
  // in the UI, aggregate the data across the selected years for all the selected
  // tags and get the top txns by various metrics like expenses, revenue and count
  // broken down by tags.

  const [inflow, outflow, allTxns] = React.useMemo(() => {
    const filteredTagData = FilterTxnTagYears(yearFilteredData, {
      tags: selectedTags,
    });
    const allTxns = AggregateTxnTagYears(filteredTagData);
    const { inflow, outflow } = SplitTxnsByFlow(filteredTagData);
    const [agInflow, agOutFlow] = [
      AggregateTxnTagYears(inflow),
      AggregateTxnTagYears(outflow),
    ];
    return [
      TopTxnTagsByAmount(agInflow),
      TopTxnTagsByAmount(agOutFlow),
      TopTxnTagsByCount(allTxns),
    ];
  }, [yearFilteredData, selectedTags]);

  return (
    <div>
      <div className="my-4 flex flex-row items-end gap-4 m-2">
        <div className="grid w-[180px] gap-1.5">
          <Label>From</Label>
          <Select
            value={fromYear.toString()}
            onValueChange={(v) => setFromYear(parseInt(v, 10))}
          >
            <SelectTrigger>
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
        </div>
        <div className="grid w-[180px] gap-1.5">
          <Label>To</Label>
          <Select
            value={toYear.toString()}
            onValueChange={(v) => setToYear(parseInt(v, 10))}
          >
            <SelectTrigger>
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
        <div className="grid w-full gap-1.5">
          <Label>Tags</Label>
          <MultiSelect
            values={tags}
            onSelectionChanged={(values) => setSelectedTags(values)}
            placeholder="Tags"
            id="tags-checkable-select"
          />
        </div>
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
