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
}

export default function Navbar() {
  const links: linkData[] = [
    { to: "/", name: "Home" },
    { to: "/search", name: "Search" },
    { to: "/manage", name: "Manage" },
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
