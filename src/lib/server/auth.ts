import { createMiddleware } from '@tanstack/react-start'
import { Session } from '@/lib/auth-shared'

export const authMiddleware = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    return next({ context: { session: fakeSession() } })
  },
)

export const authAPIMiddleware = createMiddleware({ type: 'request' }).server(
  async ({ next }) => {
    return next({ context: { session: fakeSession() } })
  },
)

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
