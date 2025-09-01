import { createFileRoute, useNavigate } from "@tanstack/react-router";
import SearchBar from "@/components/search/searchbar";
import {
  GetTxnsSearchParamsSchema,
  GetTxnsOpts,
  GetTxnsOptsToSearchParams,
} from "@/lib/transactions";

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
  const navigate = useNavigate({ from: Route.fullPath });
  const onSearch = (opts: Partial<GetTxnsOpts>) => {
    navigate({
      search: () => {
        const nextSp = GetTxnsOptsToSearchParams(opts);
        return { ...nextSp };
      },
    });
  };
  return (
    <div className="flex flex-col gap-4">
      <SearchBar txnSearchParams={sp} onSearch={onSearch} />
    </div>
  );
}
