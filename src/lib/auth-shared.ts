import { createIsomorphicFn } from "@tanstack/react-start";
import { getWebRequest } from "@tanstack/react-start/server";
import { authClient } from "./client/auth";
import { redirect } from "@tanstack/react-router";
import { auth } from "./auth";

export const getAuthSession = createIsomorphicFn()
  .client(async () => {
    const { data: session } = await authClient.getSession();
    return session;
  })
  .server(async () => {
    const request = getWebRequest();
    const session = await auth.api.getSession({ headers: request.headers });
    return session;
  });

export async function ensureLoggedIn() {
  const session = await getAuthSession();
  if (session === null) {
    throw redirect({ to: "/" });
  }
}

export async function ensureNotLoggedIn() {
  const session = await getAuthSession();
  if (session !== null) {
    throw redirect({ to: "/" });
  }
}
