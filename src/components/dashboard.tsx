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
        title="Transactions"
        description="Transactions broken down by tag"
        data={allTxns}
      />
      <TransactionsPieChart
        title="Expenses"
        description="Money flowing out of your accounts"
        data={outflow}
      />
      <TransactionsPieChart
        title="Expenses"
        description="Money flowing into your accounts"
        data={inflow}
      />
    </div>
  );
}
