import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import {
  GetTxnsSearchParamsSchema,
  GetTxnsSearchParamsToOpts,
  GetTxnsSearchParams,
  TxnsResult,
} from "@/lib/transactions";
import { GetTxns } from "@/lib/server/db/transactions";
import SearchBar from "@/components/search/searchbar";
import { SearchBarParams } from "@/components/search/searchbar";
import { TransactionsTable } from "@/components/search/transactions-table";
import { PaginationState } from "@tanstack/react-table";
import * as React from "react";
import { DateAsString } from "@/lib/date";

const defaultPageSize = 25;

interface PaginationSearchParams {
  pageSize?: number;
  prevDate?: string;
  prevID?: string;
  nextDate?: string;
  nextID?: string;
}

const GetTxnsServerFn = createServerFn({
  method: "GET",
})
  .validator(GetTxnsSearchParamsSchema)
  .handler(async (ctx) => {
    const opts = GetTxnsSearchParamsToOpts(ctx.data);
    opts.pageSize =
      opts.pageSize !== undefined ? opts.pageSize : defaultPageSize;
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

const inferPageIndex = (data: TxnsResult): number => {
  const pageSize = data.txns.length;
  if (pageSize === 0) {
    return 0;
  }
  return Math.ceil(data.beforeCount / pageSize);
};

const splitSearchParams = (
  sp: GetTxnsSearchParams
): [SearchBarParams, PaginationSearchParams] => {
  return [
    {
      from: sp.from,
      to: sp.to,
      desc: sp.desc,
      descOp: sp.descOp,
      amount: sp.amount,
      amountOp: sp.amountOp,
      inst: sp.inst,
      instOp: sp.instOp,
    },
    {
      pageSize: sp.pageSize,
      nextDate: sp.nextDate,
      nextID: sp.nextID,
      prevDate: sp.prevDate,
      prevID: sp.prevID,
    },
  ];
};

function onPaginationStateChange({
  sp,
  data,
  curPagState,
  newPagState,
}: {
  sp: GetTxnsSearchParams;
  data: TxnsResult;
  curPagState: PaginationState;
  newPagState: PaginationState;
}): [SearchBarParams, PaginationSearchParams] {
  const [sbp, _] = splitSearchParams(sp);

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
    return [sbp, { pageSize: newPagState.pageSize }];
  }

  if (newPagState.pageIndex > curPagState.pageIndex) {
    if (!data.next) {
      // Likely a bug in the total count logic in the transactions db fetching.
      console.error(
        `Unable to go to next page because fetched data indicated there's no next page.`
      );
      return [sbp, { pageSize: newPagState.pageSize }];
    }
    return [
      sbp,
      {
        pageSize: newPagState.pageSize,
        nextDate: DateAsString(data.next.date),
        nextID: String(data.next.id),
      },
    ];
  }

  if (!data.prev) {
    // Likely a bug in the total count logic in the transactions db fetching.
    console.error(
      `Unable to go to previous page because fetched data indicated there's no next page.`
    );
    return [sbp, { pageSize: newPagState.pageSize }];
  }

  return [
    sbp,
    {
      pageSize: newPagState.pageSize,
      prevDate: DateAsString(data.prev.date),
      prevID: String(data.prev.id),
    },
  ];
}

function Search() {
  const sp = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const data = Route.useLoaderData();

  // pagination is always derived from search params
  const paginationState: PaginationState = React.useMemo(
    () => ({
      pageIndex: inferPageIndex(data),
      pageSize: sp.pageSize ?? defaultPageSize,
    }),
    [data, sp]
  );

  const navigateWithSearchAndPagination = React.useCallback(
    (sbp: SearchBarParams, pgp: PaginationSearchParams) => {
      // Delete the op param if the corresponding search field from the
      // search bar was unset. This avoids polluting the search params in the
      // link we navigate to with op values that have no effect.
      if (!sbp.desc || sbp.desc.length === 0) {
        delete sbp.desc;
        delete sbp.descOp;
      }
      if (sbp.amount === undefined || isNaN(Number(sbp.amount))) {
        delete sbp.amount;
        delete sbp.amountOp;
      }
      if (!sbp.inst || sbp.inst.length === 0) {
        delete sbp.inst;
        delete sbp.instOp;
      }
      if (pgp.pageSize === defaultPageSize) {
        delete pgp.pageSize;
      }

      const newSp: GetTxnsSearchParams = {
        // Search bar.
        from: sbp.from,
        to: sbp.to,
        desc: sbp.desc,
        descOp: sbp.descOp,
        amount: sbp.amount,
        amountOp: sbp.amountOp,
        inst: sbp.inst,
        instOp: sbp.instOp,

        // Pagination.
        pageSize: pgp.pageSize,
        nextDate: pgp.nextDate,
        nextID: pgp.nextID,
        prevDate: pgp.prevDate,
        prevID: pgp.prevID,
      };
      console.log(
        `nagivateWithSearchAndPagination(curSp=${JSON.stringify(sbp)}, pgState=${JSON.stringify(pgp)}}) to newSp=${JSON.stringify(newSp)}`
      );
      navigate({
        search: () => newSp,
      });
    },
    [navigate]
  );

  const onSearchBarChange = React.useCallback(
    (newSbp: SearchBarParams) => {
      console.log(
        `onSearchBarChange params=${JSON.stringify(newSbp)}, sp=${JSON.stringify(sp)}`
      );
      // Discard page cursors on search bar parameters changing because those
      // change how the transactions are paginated.
      navigateWithSearchAndPagination(newSbp, { pageSize: sp.pageSize });
    },
    [sp, navigateWithSearchAndPagination]
  );

  const setPaginationState = React.useCallback(
    (
      updater: PaginationState | ((old: PaginationState) => PaginationState)
    ) => {
      const newPaginationState =
        typeof updater === "function" ? updater(paginationState) : updater;
      const [spWithPagination, newPagState] = onPaginationStateChange({
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
        params={sp}
        onParamsChange={onSearchBarChange}
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
