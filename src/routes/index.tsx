import Dashboard from "@/components/dashboard";
import Login from "@/components/login";
import { getAuthSession } from "@/lib/auth-shared";
import { createFileRoute, useRouter } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  async loader(ctx) {
    return getAuthSession();
  },
  component: Home,
});

function Home() {
  const router = useRouter();
  const session = Route.useLoaderData();
  const loggedIn = session !== null;
  if (loggedIn) {
    return <Dashboard />;
  }
  return <Login onLogin={() => router.invalidate()} />;
}
