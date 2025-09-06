import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import {
  GetTxnsSearchParamsSchema,
  GetTxnsOpts,
  GetTxnsOptsToSearchParams,
  GetTxnsSearchParamsToOpts,
} from "@/lib/transactions";
import { GetTxns } from "@/lib/server/db/transactions";
import SearchBar from "@/components/search/searchbar";
import { TransactionsTable } from "@/components/search/transactions-table";
import { PaginationState } from "@tanstack/react-table";
import * as React from "react";

const GetTxnsServerFn = createServerFn({
  method: "GET",
})
  .validator(GetTxnsSearchParamsSchema)
  .handler(async (ctx) => {
    const opts = GetTxnsSearchParamsToOpts(ctx.data);
    return GetTxns({ ...opts });
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
  const [paginationState, setPaginationState] = React.useState<PaginationState>(
    {
      pageIndex: 0,
      pageSize: 25,
    }
  );
  const sp = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const onSearch = (opts: Partial<GetTxnsOpts>) => {
    navigate({
      search: () => {
        const nextSp = GetTxnsOptsToSearchParams(opts);
        return { ...nextSp, ...paginationState };
      },
    });
  };
  React.useEffect(() => {
    const opts = GetTxnsSearchParamsToOpts(sp);
    onSearch(opts);
  }, [paginationState]);

  const data = Route.useLoaderData();
  console.log(
    `Rendering search page with pagination state ${JSON.stringify(paginationState)} and ${data.txns.length} transactions.`
  );
  return (
    <div className="flex flex-col">
      <SearchBar
        txnSearchParams={sp}
        onSearch={onSearch}
        className="mx-4 mt-4"
      />
      <TransactionsTable
        data={data.txns}
        className="m-4"
        enableActions
        onRowIdSelectionChange={(rowIds) =>
          console.log(`Selected row ids: ${JSON.stringify(rowIds)}`)
        }
        paginationState={paginationState}
        setPaginationState={setPaginationState}
        rowCount={data.totalCount}
      />
    </div>
  );
}
