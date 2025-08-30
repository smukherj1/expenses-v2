import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod/v4";
import SearchBar from "@/components/search/searchbar";
import {
  GetTxnsSearchParamsSchema,
  GetTxnsOpts,
} from "@/lib/server/db/transactions";

export const Route = createFileRoute("/search")({
  validateSearch: GetTxnsSearchParamsSchema,
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
  const onSearch = (opts: Partial<GetTxnsOpts>) => {
    console.log(`Search: ${JSON.stringify(opts)}`);
  };
  return (
    <div className="flex flex-col gap-4">
      <SearchBar txnSearchParams={sp} onSearch={onSearch} />
      <p>{JSON.stringify(sp)}</p>
    </div>
  );
}
