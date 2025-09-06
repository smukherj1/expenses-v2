import * as React from "react";
import { ColumnDef, PaginationState, OnChangeFn } from "@tanstack/react-table";
import { Txn } from "@/lib/transactions";
import { DataTable } from "../data-table";
import { DateAsString } from "@/lib/date";
import { Checkbox } from "@/components/ui/checkbox";

function getColumns(enableActions: boolean): ColumnDef<Txn>[] {
  return [
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
}

interface TransactionsTableProps {
  data: Txn[];
  className?: string;
  enableActions?: boolean;
  onRowIdSelectionChange?: (rowIds: string[]) => void;
  paginationState?: PaginationState;
  setPaginationState?: OnChangeFn<PaginationState>;
  rowCount?: number;
}

export function TransactionsTable({
  data,
  className,
  enableActions,
  onRowIdSelectionChange,
  paginationState,
  setPaginationState,
  rowCount,
}: TransactionsTableProps) {
  const columns = React.useMemo(() => {
    return getColumns(enableActions || false);
  }, [enableActions]);
  return (
    <DataTable
      columns={columns}
      data={data}
      className={className}
      getRowId={(row) => `${row.id}`}
      onRowIdSelectionChange={onRowIdSelectionChange}
      paginationState={paginationState}
      setPaginationState={setPaginationState}
      rowCount={rowCount}
    />
  );
}
