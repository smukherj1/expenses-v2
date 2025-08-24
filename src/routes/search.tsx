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
  from: z.string().optional().catch(undefined),
  to: z.string().optional().catch(undefined),
  desc: z.string().optional().catch(undefined),
  descOp: z.enum(strOps).optional().catch(undefined),
  source: z.string().optional().catch(undefined),
  sourceOp: z.enum(strOps).optional().catch(undefined),
  amount: z.number().optional().catch(undefined),
  amountOp: z.enum(numOps).optional().catch(undefined),
  pageSize: z.number().optional().catch(undefined),
  next: z
    .object({ date: z.string(), id: z.number() })
    .optional()
    .catch(undefined),
});

type txnSearchParams = z.infer<typeof txnsSearchParamsSchema>;

export const Route = createFileRoute("/search")({
  validateSearch: (sp): txnSearchParams => txnsSearchParamsSchema.parse(sp),
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
    <>
      <p>Search Page</p>
      <SearchBar />
    </>
  );
}
