import { Link, useRouter } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { authClient } from "@/lib/client/auth";
import { Button } from "./ui/button";
import { useMutation } from "@tanstack/react-query";

interface linkData {
  to: string;
  name: string;
  reqiresLogin: boolean;
}

export default function Navbar() {
  const { data: session } = authClient.useSession();
  const loggedIn = session !== null;

  const router = useRouter();
  const redirectHome = () => router.navigate({ to: "/" });
  const signoutMutator = useMutation({
    mutationFn: () =>
      authClient.signOut({ fetchOptions: { onSuccess: redirectHome } }),
  });

  // We show the link to the home page irrespective of the
  // logged in state. Otherwise we only display a link to a
  // page that requires login only if the user is logged in
  // and vice versa.
  const links: linkData[] = [
    { to: "/", name: "Home", reqiresLogin: false },
    { to: "/login", name: "Login", reqiresLogin: false },
    { to: "/search", name: "Search", reqiresLogin: true },
    { to: "/manage", name: "Manage", reqiresLogin: true },
  ].filter((l) => l.name === "Home" || l.reqiresLogin === loggedIn);
  return (
    <div className="p-2 flex items-center justify-between shadow-lg border-b border-neutral-800 bg-neutral-950">
      <Link to="/" className="font-bold text-xl p-2 text-neutral-100">
        Expenses Tracker
      </Link>
      <NavigationMenu>
        <NavigationMenuList>
          {links.map(({ to, name }) => {
            return (
              <NavigationMenuItem key={name}>
                <Link
                  to={to}
                  className={`${navigationMenuTriggerStyle()} font-bold`}
                  activeProps={{ className: "text-blue-400" }}
                >
                  {name}
                </Link>
              </NavigationMenuItem>
            );
          })}
          {loggedIn && (
            <NavigationMenuItem
              key="Sign Out"
              className="flex flex-row items-center justify-center w-[90px]"
            >
              {signoutMutator.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Button
                  variant="link"
                  className={`${navigationMenuTriggerStyle()} font-bold`}
                  onClick={() => signoutMutator.mutate()}
                >
                  Sign Out
                </Button>
              )}
            </NavigationMenuItem>
          )}
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
}
