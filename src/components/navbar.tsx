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
    <nav className="bg-amber-200">
      {links.map((link) => (
        <Link to={link.to} key={link.name}>
          {link.name}
        </Link>
      ))}
    </nav>
  );
}
