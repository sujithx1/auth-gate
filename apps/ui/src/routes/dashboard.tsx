import React from "react";
import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import Dashboard from "../pages/Dashboard";
import { queryClient, fetchUserSession } from "../router";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async () => {
    const user = await queryClient.fetchQuery({
      queryKey: ["session"],
      queryFn: fetchUserSession,
    });
    if (!user) {
      throw redirect({ to: "/login" });
    }
  },
  component: DashboardComponent,
});

function DashboardComponent() {
  const navigate = useNavigate();
  const [error, setError] = React.useState<string | null>(null);
  const { data: user } = useQuery({
    queryKey: ["session"],
    queryFn: fetchUserSession,
  });

  if (!user) return null;

  return (
    <div className="p-6">
      {error && <div className="p-3 bg-destructive/15 text-destructive border border-destructive/20 rounded-lg text-xs mb-4">{error}</div>}
      <Dashboard
        user={user}
        onLogout={() => {
          queryClient.setQueryData(["session"], null);
          navigate({ to: "/login" });
        }}
        onNavigateOrgs={() => navigate({ to: "/orgs" })}
        onNavigateClients={() => navigate({ to: "/clients" })}
        onError={setError}
      />
    </div>
  );
}
