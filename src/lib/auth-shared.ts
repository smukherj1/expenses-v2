import { createIsomorphicFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { redirect } from '@tanstack/react-router'
import { authClient } from './client/auth'
import { auth } from './auth'

export const getAuthSession = createIsomorphicFn()
  .client(async (): Promise<Session | null> => {
    const { data: session } = await authClient.getSession();
    return session;
  })
  .server(async () => {
    const headers = getRequestHeaders();
    return auth.api.getSession({ headers });
  })

export async function ensureLoggedIn() {
  const session = await getAuthSession()
  if (session === null) {
    throw redirect({ to: '/' })
  }
}

export async function ensureNotLoggedIn() {
  const session = await getAuthSession()
  if (session !== null) {
    throw redirect({ to: '/' })
  }
}

export interface User {
  id: string
  email: string
  name: string
  image?: string | null | undefined
}

export interface Session {
  user: User
}
