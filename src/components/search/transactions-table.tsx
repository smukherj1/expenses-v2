import { ColumnDef } from "@tanstack/react-table";
import { Txn } from "@/lib/transactions";
import { DataTable } from "../data-table";
import { DateAsString } from "@/lib/date";

export const columns: ColumnDef<Txn>[] = [
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => {
      return <div>{DateAsString(row.getValue("date"))}</div>;
    },
  },
  {
    accessorKey: "description",
    header: "Description",
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"));
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "CAD",
      }).format(amount);

      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "institution",
    header: "Institution",
  },
  {
    accessorKey: "tag",
    header: "Tag",
  },
];

interface TransactionsTableProps {
  data: Txn[];
}

export function TransactionsTable({ data }: TransactionsTableProps) {
  return <DataTable columns={columns} data={data} />;
}
