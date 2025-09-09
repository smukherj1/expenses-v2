import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import {
  GetTxnsSearchParamsSchema,
  GetTxnsOpts,
  GetTxnsOptsToSearchParams,
  GetTxnsSearchParamsToOpts,
  GetTxnsSearchParams,
  TxnsResult,
} from "@/lib/transactions";
import { GetTxns } from "@/lib/server/db/transactions";
import SearchBar from "@/components/search/searchbar";
import { TransactionsTable } from "@/components/search/transactions-table";
import { PaginationState } from "@tanstack/react-table";
import * as React from "react";
import { DateAsString } from "@/lib/date";

const GetTxnsServerFn = createServerFn({
  method: "GET",
})
  .validator(GetTxnsSearchParamsSchema)
  .handler(async (ctx) => {
    const opts = GetTxnsSearchParamsToOpts(ctx.data);
    return GetTxns({ ...opts, ...applyPaginationDefaults(opts) });
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

const defaultPaginationState: PaginationState = {
  pageIndex: 0,
  pageSize: 25,
};

const applyPaginationDefaults = (
  s: Partial<PaginationState>
): PaginationState => ({
  pageIndex: s.pageIndex ?? defaultPaginationState.pageIndex,
  pageSize: s.pageSize ?? defaultPaginationState.pageSize,
});

const removePaginationDefaults = (
  s: PaginationState
): Partial<PaginationState> => ({
  ...(s.pageIndex !== defaultPaginationState.pageIndex && {
    pageIndex: s.pageIndex,
  }),
  ...(s.pageSize !== defaultPaginationState.pageSize && {
    pageSize: s.pageSize,
  }),
});

function applyPaginationToGetTxnParams({
  sp,
  data,
  curPagState,
  newPagState,
}: {
  sp: GetTxnsSearchParams;
  data: TxnsResult;
  curPagState: PaginationState;
  newPagState: PaginationState;
}): [GetTxnsSearchParams, PaginationState] {
  const spCopy = { ...sp };
  delete spCopy.nextDate;
  delete spCopy.nextID;
  delete spCopy.prevDate;
  delete spCopy.prevID;

  // Reset to page 0 unless we're navigating with the same page size
  // to cur page + 1 or cur page - 1. This is because we paginate using
  // the transaction cursors in the fetched transaction data that only
  // allow jumping one page at a time.
  if (
    curPagState.pageSize !== newPagState.pageSize ||
    newPagState.pageIndex === 0 ||
    curPagState.pageIndex === newPagState.pageIndex ||
    newPagState.pageIndex > curPagState.pageIndex + 1 ||
    newPagState.pageIndex < curPagState.pageIndex - 1
  ) {
    delete spCopy.pageIndex;
    return [spCopy, { pageSize: newPagState.pageSize, pageIndex: 0 }];
  }

  if (newPagState.pageIndex > curPagState.pageIndex) {
    if (!data.next) {
      // Likely a bug in the total count logic in the transactions db fetching.
      console.error(
        `Unable to go to next page because fetched data indicated there's no next page.`
      );
      return [spCopy, { pageSize: newPagState.pageSize, pageIndex: 0 }];
    }
    return [
      {
        ...spCopy,
        nextDate: DateAsString(data.next.date),
        nextID: String(data.next.id),
      },
      newPagState,
    ];
  }

  if (!data.prev) {
    // Likely a bug in the total count logic in the transactions db fetching.
    console.error(
      `Unable to go to previous page because fetched data indicated there's no next page.`
    );
    return [spCopy, { pageSize: newPagState.pageSize, pageIndex: 0 }];
  }

  return [
    {
      ...spCopy,
      prevDate: DateAsString(data.prev.date),
      prevID: String(data.prev.id),
    },
    newPagState,
  ];
}

function Search() {
  const sp = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const data = Route.useLoaderData();

  // pagination is always derived from search params
  const paginationState = React.useMemo(
    () => applyPaginationDefaults(sp),
    [sp]
  );

  const navigateWithSearchAndPagination = React.useCallback(
    (curSp: GetTxnsSearchParams, pgState: PaginationState) => {
      const curSpCopy = { ...curSp };
      // Remove existing pagination state from the search params to force apply the
      // state from 'pgState'. This ensures if a field in pgState is undefined, it
      // gets removed from the search params.
      delete curSpCopy.pageIndex;
      delete curSpCopy.pageSize;

      // Delete the op param if the corresponding search field from the
      // search bar was unset. This avoids polluting the search params in the
      // link we navigate to with op values that have no effect.
      if (!curSpCopy.desc || curSpCopy.desc.length === 0) {
        delete curSpCopy.descOp;
      }
      if (curSpCopy.amount === undefined || isNaN(Number(curSpCopy.amount))) {
        delete curSpCopy.amountOp;
      }
      if (!curSpCopy.inst || curSpCopy.inst.length === 0) {
        delete curSpCopy.instOp;
      }

      const newSp = {
        ...curSpCopy,
        ...removePaginationDefaults(pgState),
      };
      console.log(
        `nagivateWithSearchAndPagination(curSp=${JSON.stringify(curSp)}, pgState=${JSON.stringify(pgState)}}) to newSp=${JSON.stringify(newSp)}`
      );
      navigate({
        search: () => newSp,
      });
    },
    [navigate]
  );

  const onSearchBarChange = React.useCallback(
    (opts: Partial<GetTxnsOpts>) => {
      const newSp = GetTxnsOptsToSearchParams(opts);
      navigateWithSearchAndPagination(newSp, paginationState);
    },
    [paginationState, navigateWithSearchAndPagination]
  );

  const setPaginationState = React.useCallback(
    (
      updater: PaginationState | ((old: PaginationState) => PaginationState)
    ) => {
      const newPaginationState =
        typeof updater === "function" ? updater(paginationState) : updater;
      const [spWithPagination, newPagState] = applyPaginationToGetTxnParams({
        sp,
        data,
        curPagState: paginationState,
        newPagState: newPaginationState,
      });
      console.log(
        `PaginationState update from ${JSON.stringify(paginationState)}` +
          `to ${JSON.stringify(newPaginationState)}, ` +
          `updated sp=${JSON.stringify(spWithPagination)}, ` +
          `updated pgState=${JSON.stringify(newPagState)}`
      );
      navigateWithSearchAndPagination(spWithPagination, newPagState);
    },
    [data, paginationState, sp, navigateWithSearchAndPagination]
  );

  console.log(
    `Rendering search page with pagination state ${JSON.stringify(paginationState)} and ${data.txns.length} transactions.`
  );
  return (
    <div className="flex flex-col">
      <SearchBar
        txnSearchParams={sp}
        onChange={onSearchBarChange}
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
