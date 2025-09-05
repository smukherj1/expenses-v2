import { ColumnDef } from "@tanstack/react-table";
import { Txn } from "@/lib/transactions";
import { DataTable } from "../data-table";
import { DateAsString } from "@/lib/date";
import { Checkbox } from "@/components/ui/checkbox";

export const columns: ColumnDef<Txn>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
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
  className?: string;
  onRowIdSelectionChange?: (rowIds: string[]) => void;
}

export function TransactionsTable({
  data,
  className,
  onRowIdSelectionChange,
}: TransactionsTableProps) {
  return (
    <DataTable
      columns={columns}
      data={data}
      className={className}
      getRowId={(row) => `${row.id}`}
      onRowIdSelectionChange={onRowIdSelectionChange}
    />
  );
}
