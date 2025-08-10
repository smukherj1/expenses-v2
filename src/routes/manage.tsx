import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/manage")({
  component: Manage,
});

function Manage() {
  return (
    <div>
      <input type="file" className="file-input" />
    </div>
  );
}
