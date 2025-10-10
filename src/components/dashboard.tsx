import * as React from "react";
import TransactionsPieChart from "./transactions-pie-chart";
import {
  AggregateTxnTagYears,
  FilterTxnInstitutions,
  FilterTxnYears,
  InstitutionsFromTxnsTagYearInsts,
  SplitTxnsByFlow,
  TagsFromTxnsTagYears,
  TopTxnTagsByAmount,
  TopTxnTagsByCount,
  TopTxnTagYearsByAmount,
  FilterTxnTags,
  TxnsTagYearInst,
  YearsFromTxnsTagYears,
  AggregateTxnsTagYearInsts,
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
import TransactionsBarChart from "./transactions-bar-chart";

interface Props {
  data: TxnsTagYearInst[];
}

export default function Dashboard({ data }: Props) {
  // First stage: Compute the unique years the data covers.
  const [minYear, maxYear] = React.useMemo(() => {
    const allYears = YearsFromTxnsTagYears(data);
    const minYear = allYears.length > 0 ? Math.min(...allYears) : 2010;
    const maxYear = allYears.length > 0 ? Math.max(...allYears) : 2010;

    return [minYear, maxYear];
  }, [data]);

  // Second stage: Based on the min and max years in the data, initialize
  // and update the state of the dropdowns allowing the user to select the
  // range of years of data to display in the dashboard charts.
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

  // Third stage: Filter the data to only cover the years selected by the user. Compute
  // the list of institutions from the filtered transactions.
  const [yearFilteredData, institutions] = React.useMemo(() => {
    const filtered = FilterTxnYears(data, { fromYear, toYear });
    const institutions = InstitutionsFromTxnsTagYearInsts(data);
    return [filtered, institutions];
  }, [data]);

  // Fourth state: Initialize and update the state of the dropdown allowing the user to
  // select the instututions they'd like to display the data for in the dashboard.
  const [selectedInsts, setSelectedInsts] =
    React.useState<string[]>(institutions);

  // If the computed list of institutions changed, e.g., due to selecting a range of
  // years, update the selection back to selecting all institutions.
  React.useEffect(() => {
    setSelectedInsts(institutions);
  }, [institutions]);

  // Fifth stage: Filter the to only cover the institutions selected by the users. Compute
  // the list of tags from the filtered transactions.
  const [filteredInsts, tags] = React.useMemo(() => {
    const filtered = FilterTxnInstitutions(yearFilteredData, selectedInsts);
    const tags = TagsFromTxnsTagYears(filtered);
    return [filtered, tags];
  }, [yearFilteredData, selectedInsts]);

  // Sixth stage: Initialize and update the state of the dropdown allowing the user to
  // select the tags they'd like to display the data for in the dashboard.
  const [selectedTags, setSelectedTags] =
    React.useState<(string | null)[]>(tags);

  // If the computed list of tags changed, e.g, due to selecting a range of years,
  // update the selection tags back to selecting all the new set of tags.
  React.useEffect(() => {
    setSelectedTags(tags);
  }, [tags]);

  // Seventh stage: Filter the data based on the tags selected by the user. Then,
  // aggregate the data across the institutions. After this, the data is split into
  // inflow and outflow and then:
  // - The top tags are selected from the yearly data in bar charts.
  // - The data is aggregated across years and then the top tags are
  //   shown in pie charts.
  const [inflow, outflow, allTxns, inflowYearly, outflowYearly] =
    React.useMemo(() => {
      const filteredTagData = FilterTxnTags(filteredInsts, {
        tags: selectedTags,
      });
      const instAggregated = AggregateTxnsTagYearInsts(filteredTagData);
      const allTxns = AggregateTxnTagYears(instAggregated);
      const { inflow, outflow } = SplitTxnsByFlow(instAggregated);
      const [agInflow, agOutFlow] = [
        AggregateTxnTagYears(inflow),
        AggregateTxnTagYears(outflow),
      ];
      return [
        TopTxnTagsByAmount(agInflow),
        TopTxnTagsByAmount(agOutFlow),
        TopTxnTagsByCount(allTxns),
        TopTxnTagYearsByAmount(inflow),
        TopTxnTagYearsByAmount(outflow),
      ];
    }, [filteredInsts, selectedTags]);

  return (
    <div>
      <div className="my-4 flex flex-row items-end gap-4 m-2">
        <div className="grid min-w-[120px] gap-1.5">
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
        <div className="grid min-w-[120px] gap-1.5">
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
        <div className="grid min-w-[220px] gap-1.5">
          <Label>Institutions</Label>
          <MultiSelect
            values={institutions}
            onSelectionChanged={(values) =>
              setSelectedInsts(values.filter((v) => v !== null))
            }
            placeholder="Institutions"
            id="insts-multi-select"
          />
        </div>
        <div className="grid min-w-[220px] gap-1.5">
          <Label>Tags</Label>
          <MultiSelect
            values={tags}
            onSelectionChanged={(values) => setSelectedTags(values)}
            placeholder="Tags"
            id="tags-multi-select"
          />
        </div>
      </div>
      <TransactionsPieChart
        title="All Transactions"
        dataKey="count"
        description="All your transactions broken down by tag"
        data={allTxns}
      />
      <TransactionsBarChart
        title="Yearly Inflow"
        description="Money flowing into your accounts by year broken down by tag"
        data={inflowYearly}
      />
      <TransactionsBarChart
        title="Yearly Expenses"
        description="Money flowing out of your accounts by year broken down by tag"
        data={outflowYearly}
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
