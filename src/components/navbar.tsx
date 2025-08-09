import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
} from "./ui/navigation-menu";
import { Link } from "@tanstack/react-router";

interface linkData {
  path: string;
  name: string;
}

export default function Navbar() {
  const links: linkData[] = [
    { path: "/", name: "Home" },
    { path: "/search", name: "Search" },
  ];
  return (
    <NavigationMenu>
      {links.map(({ path, name }) => {
        return (
          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <Link to={path}>{name}</Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
        );
      })}
    </NavigationMenu>
  );
}
