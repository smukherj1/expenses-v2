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
    <div className="navbar bg-base-100 shadow-sm">
      <div className="flex-1">
        <span className="btn btn-ghost text-xl">Expenses Tracker</span>
      </div>
      <div className="flex-none">
        <ul className="menu menu-horizontal px-1">
          {links.map(({ to, name }) => {
            return (
              <li key={name}>
                <Link
                  to={to}
                  className="font-bold"
                  activeProps={{ className: "text-rose-500" }}
                >
                  {name}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
