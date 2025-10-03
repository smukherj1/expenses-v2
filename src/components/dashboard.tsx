import * as React from "react";
import TransactionsPieChart from "./transactions-pie-chart";
import {
  AggregateTxnTagYears,
  SplitTxnsByFlow,
  TopTxnTagsByAmount,
  TopTxnTagsByCount,
  TxnsTagYear,
} from "@/lib/transactions";

interface DashboardProps {
  data: TxnsTagYear[];
}

export default function Dashboard({ data }: DashboardProps) {
  const [inflow, outflow, allTxns] = React.useMemo(() => {
    const allTxns = AggregateTxnTagYears(data);
    const { inflow, outflow } = SplitTxnsByFlow(data);
    const [agInflow, agOutFlow] = [
      AggregateTxnTagYears(inflow),
      AggregateTxnTagYears(outflow),
    ];
    return [
      TopTxnTagsByAmount(agInflow),
      TopTxnTagsByAmount(agOutFlow),
      TopTxnTagsByCount(allTxns),
    ];
  }, [data]);
  return (
    <div>
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
