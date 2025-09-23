import { createAuthClient } from "better-auth/react";
import { useRouter } from "@tanstack/react-router";
export const authClient = createAuthClient({});

export function ensureAuth() {
  const router = useRouter();

  const { data: session } = authClient.useSession();
  if (session === null) {
    console.log("User is not logged in, redirecting to login.");
    router.navigate({ to: "/login" });
  }
}

export function ensureNotAuth() {
  const router = useRouter();

  const { data: session } = authClient.useSession();
  if (session !== null) {
    console.log("User is logged in, redirecting to home.");
    router.navigate({ to: "/" });
  }
}
