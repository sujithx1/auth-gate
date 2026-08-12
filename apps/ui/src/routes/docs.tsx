import { createFileRoute } from "@tanstack/react-router";
import Docs from "../pages/Docs";

export const Route = createFileRoute("/docs")({
  component: DocsComponent,
});

function DocsComponent() {
  return <Docs />;
}
