import React from "react";
import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import Clients from "../pages/Clients";
import { queryClient, fetchUserSession } from "../router";

export const Route = createFileRoute("/clients")({
  beforeLoad: async () => {
    const user = await queryClient.fetchQuery({
      queryKey: ["session"],
      queryFn: fetchUserSession,
    });
    if (!user) {
      throw redirect({ to: "/login" });
    }
  },
  component: ClientsComponent,
});

function ClientsComponent() {
  const navigate = useNavigate();
  const [error, setError] = React.useState<string | null>(null);
  return (
    <div className="p-6 md:p-12 max-w-5xl mx-auto">
      {error && <div className="p-3 bg-destructive/15 text-destructive border border-destructive/20 rounded-lg text-xs mb-4">{error}</div>}
      <Clients onBack={() => navigate({ to: "/dashboard" })} onError={setError} />
    </div>
  );
}
