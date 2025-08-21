import { createServerFileRoute } from "@tanstack/react-start/server";
import { z } from "zod/v4";
import { GetTxns } from "@/lib/server/db/transactions";
import { StatusCodes, ReasonPhrases } from "http-status-codes";
import { formatZodError } from "@/lib/utils";

const GetSearchParamsSchema = z.object({
  from: z.coerce.date().optional().default(new Date(0)),
  to: z.coerce.date().optional().default(new Date()),
  pageSize: z.number().optional().default(0),
  next: z
    .object({
      date: z.coerce.date(),
      id: z.number(),
    })
    .optional(),
});

type GetSearchParams = z.infer<typeof GetSearchParamsSchema>;

export const ServerRoute = createServerFileRoute("/api/transactions").methods({
  GET: async ({ request }) => {
    const url = new URL(request.url);
    const searchParams: Record<string, any> = {};

    const fromParam = url.searchParams.get("from");
    if (fromParam) {
      searchParams.from = fromParam;
    }

    const toParam = url.searchParams.get("to");
    if (toParam) {
      searchParams.to = toParam;
    }

    const pageSizeParam = Number(url.searchParams.get("pageSize"));
    if (!isNaN(pageSizeParam)) {
      searchParams.pageSize = pageSizeParam;
    }

    const nextDateParam = url.searchParams.get("next.date");
    const nextIdParam = url.searchParams.get("next.id");
    if (nextDateParam && nextIdParam) {
      searchParams.next = {
        date: nextDateParam,
        id: Number(nextIdParam),
      };
    }
    const parsed = GetSearchParamsSchema.safeParse(searchParams, {
      reportInput: true,
    });

    if (!parsed.success) {
      const errorStr = parsed.error.message;
      return new Response(`${ReasonPhrases.BAD_REQUEST}: ${errorStr}\n`, {
        status: StatusCodes.BAD_REQUEST,
      });
    }

    const txns = await GetTxns(parsed.data);

    return new Response(JSON.stringify(txns, null, 2));
  },
});
