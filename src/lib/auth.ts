// Server-only: Better Auth configuration file. Added here with other
// server + client shared libs because this is where better-auth expects
// to see it.
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/server/db/client";
import {
  user,
  session,
  account,
  verification,
} from "@/lib/server/db/schema/auth-schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: {
      user,
      session,
      account,
      verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_OAUTH_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET as string,
    },
    microsoft: {
      clientId: process.env.MICROSOFT_OAUTH_CLIENT_ID as string,
      clientSecret: process.env.MICROSOFT_OAUTH_CLIENT_SECRET as string,
    },
  },
});
