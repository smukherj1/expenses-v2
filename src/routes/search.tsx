import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/search")({
  component: Search,
});

function Search() {
  return (
    <>
      <p>Search Page</p>
    </>
  );
}
