import Dashboard from '@/components/dashboard'
import Login from '@/components/login'
import { getAuthSession } from '@/lib/auth-shared'
import { authMiddleware } from '@/lib/server/auth'
import { GetTxnsByYearAndTag } from '@/lib/server/db/transactions'
import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

const GetTxnsByYearAndTagServerFn = createServerFn({
  method: 'GET',
})
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    return GetTxnsByYearAndTag(context.session)
  })

export const Route = createFileRoute('/')({
  async loader() {
    const session = await getAuthSession()
    if (session === null) {
      return { session, breakdown: [] }
    }

    const data = await GetTxnsByYearAndTagServerFn()

    return { session, data }
  },
  component: Home,
})

function Home() {
  const { data, session } = Route.useLoaderData()

  if (session !== null) {
    // User is logged in.
    return <Dashboard data={data || []} />
  }
  // User not logged in.
  return <Login />
}
