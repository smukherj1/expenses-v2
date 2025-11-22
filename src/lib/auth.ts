import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/server/db/pg-client";
import { genericOAuth } from "better-auth/plugins"
import {
  user,
  session,
  account,
  verification,
} from "@/lib/server/db/schema/auth";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user,
      session,
      account,
      verification,
    },
  }),
  plugins: [
    genericOAuth({
      config: [
        {
          providerId: "keycloak-suvanjanlabs",
          clientId: "expenses",
          clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
          discoveryUrl: "https://keycloak.suvanjanlabs.com/realms/homelab/.well-known/openid-configuration",
          scopes: ["email", "profile", "openid"],
        },
      ]
    })
  ]
});