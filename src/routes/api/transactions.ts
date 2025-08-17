import { createServerFileRoute } from "@tanstack/react-start/server";

export const ServerRoute = createServerFileRoute("/api/transactions").methods({
  GET: async ({ request }) => {
    return new Response("Hello, World!");
  },
});
