/// <reference types="vite/client" />
import type { ReactNode } from "react";
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
  return (
    <RootDocument>
      <QueryClientProvider client={queryClient}>
        <Navbar />
        <Outlet />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
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
