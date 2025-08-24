import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod/v4";
import SearchBar from "@/components/search/searchbar";

const opInc = "~";
const opExc = "!~";
const opGte = ">=";
const opLte = "<=";
const opEq = "==";
const opNeq = "!=";

const strOps = [opInc, opExc];
const numOps = [opGte, opLte, opEq, opNeq];

const txnsSearchParamsSchema = z.object({
  // Date from which to search for transactions.
  from: z.string().optional().catch(undefined),
  // Date up to which to search for transactions.
  to: z.string().optional().catch(undefined),
  // Transactions descriptions to search for.
  desc: z.string().optional().catch(undefined),
  // The operator to use on the given transaction description
  // when looking for matches.
  descOp: z.enum(strOps).optional().catch(undefined),
  // The amount that was transaction.
  amount: z.coerce.number().optional().catch(undefined),
  // The matching operation for the given amount to search
  // for.
  amountOp: z.enum(numOps).optional().catch(undefined),
});

type txnSearchParams = z.infer<typeof txnsSearchParamsSchema>;

export const Route = createFileRoute("/search")({
  validateSearch: txnsSearchParamsSchema,
  component: Search,
  errorComponent: (props) => {
    return (
      <>
        <span>Error loading search page:</span>
        <p>{props.error.message}</p>
      </>
    );
  },
});

function Search() {
  const sp = Route.useSearch();
  return (
    <div className="flex flex-col gap-4">
      <SearchBar />
      <p>{JSON.stringify(sp)}</p>
    </div>
  );
}
