import { Link } from "@tanstack/react-router";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

interface linkData {
  to: string;
  name: string;
  // True for pages that are only available when logged in.
  protected: boolean;
}

export default function Navbar() {
  const links: linkData[] = [
    { to: "/", name: "Home", protected: true },
    { to: "/login", name: "Login", protected: false },
    { to: "/search", name: "Search", protected: true },
    { to: "/manage", name: "Manage", protected: true },
  ];
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
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
}
