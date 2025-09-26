import { Link } from "@tanstack/react-router";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { authClient } from "@/lib/client/auth";
import { UserAvatar } from "./avatar";

interface linkData {
  to: string;
  name: string;
  reqiresLogin: boolean;
}

export default function Navbar() {
  const { data: session } = authClient.useSession();
  const loggedIn = session !== null;

  // We show the link to the home page irrespective of the
  // logged in state. Otherwise we only display a link to a
  // page that requires login only if the user is logged in
  // and vice versa.
  const links: linkData[] = [
    { to: "/", name: "Home", reqiresLogin: false },
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
            <NavigationMenuItem>
              <UserAvatar />
            </NavigationMenuItem>
          )}
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
}
