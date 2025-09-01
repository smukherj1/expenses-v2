import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import {
  GetTxnsSearchParamsSchema,
  GetTxnsSearchParams,
  GetTxnsOpts,
  GetTxnsOptsToSearchParams,
  GetTxnsSearchParamsToOpts,
} from "@/lib/transactions";
import { GetTxns } from "@/lib/server/db/transactions";
import SearchBar from "@/components/search/searchbar";

export const GetTxnsServerFn = createServerFn({
  method: "GET",
})
  .validator(GetTxnsSearchParamsSchema)
  .handler(async (ctx) => {
    const opts = GetTxnsSearchParamsToOpts(ctx.data);
    return GetTxns(opts);
  });

export const Route = createFileRoute("/search")({
  validateSearch: GetTxnsSearchParamsSchema,
  loaderDeps: ({ search }) => {
    return search;
  },
  loader: async ({ deps }) => {
    return GetTxnsServerFn({ data: deps });
  },
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

  const data = Route.useLoaderData();
  console.log(
    `Loaded ${data.txns.length} transactions, next=${data.next ? JSON.stringify(data.next) : "null"}:\n${JSON.stringify(data.txns, null, 2)}`
  );
  return (
    <div className="flex flex-col gap-4">
      <SearchBar txnSearchParams={sp} onSearch={onSearch} />
    </div>
  );
}
