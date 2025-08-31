import { createServerFileRoute } from "@tanstack/react-start/server";
import { GetTxns, TxnCursor } from "@/lib/server/db/transactions";
import { StatusCodes, ReasonPhrases } from "http-status-codes";

function dateOrThrow(
  value: string | null,
  param: string,
  fallback: Date
): Date {
  if (!value) {
    return fallback;
  }
  const d = new Date(value);
  if (isNaN(d.getTime())) {
    throw new Error(
      `invalid value '${value}' for param '${param}', expected valid date`
    );
  }
  return d;
}

interface GetSearchParams {
  from: Date;
  to: Date;
}

function parseGETSearchParams(params: URLSearchParams): GetSearchParams {
  return {
    from: dateOrThrow(params.get("from"), "from", new Date(0)),
    to: dateOrThrow(params.get("to"), "to", new Date()),
  };
}

export const ServerRoute = createServerFileRoute("/api/transactions").methods({
  GET: async ({ request }) => {
    const url = new URL(request.url);

    var params: GetSearchParams;

    try {
      params = parseGETSearchParams(url.searchParams);
    } catch (error) {
      return new Response(`${ReasonPhrases.BAD_REQUEST}: ${error}`, {
        status: StatusCodes.BAD_REQUEST,
      });
    }

    const stream = new ReadableStream({
      async start(controller) {
        let next: TxnCursor | undefined = undefined;
        let firstChunk = true;

        controller.enqueue("[");

        try {
          while (true) {
            const pageSize = 2000;
            const result = await GetTxns({ ...params, pageSize, next });

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
