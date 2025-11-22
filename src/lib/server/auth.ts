import { createMiddleware } from '@tanstack/react-start'
import { getAuthSession } from '@/lib/auth-shared'

export const authMiddleware = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    const session = await getAuthSession()
    return next({ context: { session } })
  },
)

export const authAPIMiddleware = createMiddleware({ type: 'request' }).server(
  async ({ next }) => {
    const session = await getAuthSession()
    return next({ context: { session } })
  },
)

