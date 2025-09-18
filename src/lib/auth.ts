// Server-only: Better Auth configuration file. Added here with other
// server + client shared libs because this is where better-auth expects
// to see it.
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/server/db/client";

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
  },
  database: drizzleAdapter(db, {
    provider: "sqlite",
  }),
});
