import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "./ui/navigation-menu";
import { Link } from "@tanstack/react-router";

interface linkData {
  to: string;
  name: string;
}

export default function Navbar() {
  const links: linkData[] = [
    { to: "/", name: "Home" },
    { to: "/search", name: "Search" },
  ];
  return (
    <NavigationMenu viewport={false}>
      <NavigationMenuList>
        {links.map(({ to, name }) => {
          return (
            <NavigationMenuItem key={name}>
              <NavigationMenuLink asChild>
                <Link to={to}>{name}</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          );
        })}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
