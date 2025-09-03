import { ColumnDef } from "@tanstack/react-table";
import { NewTxn } from "@/lib/transactions";

export const columns: ColumnDef<NewTxn>[] = [
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "amount",
    header: "Amount",
  },
];
