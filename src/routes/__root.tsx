/// <reference types="vite/client" />
import * as React from "react";
import {
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
  DefaultGlobalNotFound,
} from "@tanstack/react-router";
import Navbar from "src/components/navbar";
import appCSS from "@/styles/app.css?url";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "@/components/ui/sonner";

// Tanstack Query client.
const queryClient = new QueryClient();

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Expenses Tracker",
      },
    ],
    links: [{ rel: "stylesheet", href: appCSS }],
  }),
  component: RootComponent,
  notFoundComponent: DefaultGlobalNotFound,
  errorComponent: (props) => {
    return (
      <div>
        <span>Error loading page:</span>
        <p>{props.error.message}</p>
      </div>
    );
  },
});

function RootComponent() {
  const [showDevtools, setShowDevtools] = React.useState(false);

  React.useEffect(() => {
    // @ts-expect-error
    window.toggleDevtools = () => setShowDevtools((old) => !old);
  }, []);
  return (
    <RootDocument>
      <Toaster richColors position="top-center" />
      <QueryClientProvider client={queryClient}>
        <Navbar />
        <Outlet />
        {showDevtools && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
