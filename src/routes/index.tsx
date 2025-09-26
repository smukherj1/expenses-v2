import Dashboard from "@/components/dashboard";
import Login from "@/components/login";
import { authClient } from "@/lib/client/auth";
import { createFileRoute, useRouter } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const router = useRouter();
  const loggedIn = authClient.useSession().data !== null;
  return (
    <>
      {loggedIn ? <Dashboard /> : <Login onLogin={() => router.invalidate()} />}
    </>
  );
}
