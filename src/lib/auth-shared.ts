import { createIsomorphicFn } from '@tanstack/react-start'
import { redirect } from '@tanstack/react-router'

export const getAuthSession = createIsomorphicFn()
  .client(async (): Promise<Session> => fakeSession())
  .server(async () => fakeSession())

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

function fakeSession(): Session {
  return {
    user: {
      id: '0',
      email: 'test@gmail.com',
      name: 'Test User',
      image: null,
    },
  }
}
