import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
  DefaultGlobalNotFound,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'
// Import directly instead of as URL added to the link to prevent a 
// hydration mismatch.
import '../styles.css'
import type { QueryClient } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/sonner'
import Navbar from 'src/components/navbar'
import { getAuthSession } from '@/lib/auth-shared'

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Expenses Tracker',
      },
    ],
    links: [],
  }),
  loader: async () => getAuthSession(),
  shellComponent: RootDocument,
  notFoundComponent: DefaultGlobalNotFound,
  errorComponent: (props) => {
    return (
      <div>
        <span>Error loading page:</span>
        <p>{props.error.message}</p>
      </div>
    )
  },
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const session = Route.useLoaderData();
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        <Navbar session={session} />
        {children}
        <Toaster richColors position="top-center" />
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
            TanStackQueryDevtools,
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
