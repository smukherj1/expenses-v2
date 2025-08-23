import { createServerFileRoute } from "@tanstack/react-start/server";
import { GetTxns, GetTxnsOpts } from "@/lib/server/db/transactions";
import { StatusCodes, ReasonPhrases } from "http-status-codes";

function mustDateOrThrow(value: string, param: string): Date {
  const d = new Date(value);
  if (isNaN(d.getTime())) {
    throw new Error(
      `invalid value '${value}' for param '${param}', expected valid date`
    );
  }
  return d;
}

function dateOrThrow(
  value: string | null,
  param: string,
  fallback: Date
): Date {
  if (!value) {
    return fallback;
  }
  return mustDateOrThrow(value, param);
}

function mustNumberOrThrow(value: string, param: string): number {
  const n = Number(value);
  if (isNaN(n)) {
    throw new Error(
      `invalid value '${value}' for param '${param}, expected valid number`
    );
  }
  return n;
}

function numberOrThrow(
  value: string | null,
  param: string,
  fallback: number
): number {
  if (!value) {
    return fallback;
  }
  return mustNumberOrThrow(value, param);
}

interface GetNext {
  date: Date;
  id: number;
}

interface GetSearchParams {
  from: Date;
  to: Date;
  pageSize: number;
  next?: GetNext;
}

function parseGETSearchParams(params: URLSearchParams): GetSearchParams {
  const nextID = params.get("next.id");
  const nextDate = params.get("next.date");
  const next =
    nextID && nextDate
      ? {
          date: mustDateOrThrow(nextDate, "next.date"),
          id: mustNumberOrThrow(nextID, "next.id"),
        }
      : undefined;
  return {
    from: dateOrThrow(params.get("from"), "from", new Date(0)),
    to: dateOrThrow(params.get("to"), "to", new Date()),
    pageSize: numberOrThrow(params.get("pageSize"), "pageSize", 0),
    next: next,
  };
}

export const ServerRoute = createServerFileRoute("/api/transactions").methods({
  GET: async ({ request }) => {
    const url = new URL(request.url);

    var params: GetTxnsOpts;

    try {
      params = parseGETSearchParams(url.searchParams);
    } catch (error) {
      return new Response(`${ReasonPhrases.BAD_REQUEST}: ${error}`, {
        status: StatusCodes.BAD_REQUEST,
      });
    }

    const stream = new ReadableStream({
      async start(controller) {
        let next = params.next;
        let firstChunk = true;

        controller.enqueue("[");

        try {
          while (true) {
            const result = await GetTxns({ ...params, pageSize: 1000, next });

            if (result.txns.length > 0) {
              if (!firstChunk) {
                controller.enqueue(",\n");
              }
              controller.enqueue(
                result.txns.map((t) => JSON.stringify(t)).join(",\n")
              );
              firstChunk = false;
            }

            if (result.next) {
              next = result.next;
            } else {
              break;
            }
          }
          controller.enqueue("]");
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "application/json" },
    });
  },
});
