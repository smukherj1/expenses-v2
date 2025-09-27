import { createMiddleware } from "@tanstack/react-start";
import { getWebRequest } from "@tanstack/react-start/server";
import { auth } from "@/lib/auth";

export const authMiddleware = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const request = getWebRequest();
    const session = await auth.api.getSession({ headers: request.headers });
    if (session === null) {
      throw new Error(
        `Unauthenticated: permission denied to protected server API`
      );
    }
    return next({ context: { session } });
  }
);

export const authAPIMiddleware = createMiddleware({ type: "request" }).server(
  async ({ next }) => {
    const request = getWebRequest();
    const session = await auth.api.getSession({ headers: request.headers });
    if (session === null) {
      throw new Error(
        `Unauthenticated: permission denied to protected server API`
      );
    }
    return next({ context: { session } });
  }
);
