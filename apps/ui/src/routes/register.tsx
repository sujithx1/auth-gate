import React from "react";
import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import Register from "../pages/Register";
import { queryClient, fetchUserSession } from "../router";

export const Route = createFileRoute("/register")({
  beforeLoad: async () => {
    const user = await queryClient.fetchQuery({
      queryKey: ["session"],
      queryFn: fetchUserSession,
    });
    if (user) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: RegisterComponent,
});

function RegisterComponent() {
  const navigate = useNavigate();
  const [error, setError] = React.useState<string | null>(null);
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-12">
      <div className="w-full max-w-md z-10 space-y-6">
        <div className="flex items-center justify-center gap-2 mb-8 select-none">
          <ShieldCheck className="w-9 h-9 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Auth<span className="text-muted-foreground font-medium">Gate</span></h1>
        </div>
        {error && <div className="p-3 bg-destructive/15 text-destructive border border-destructive/20 rounded-lg text-xs">{error}</div>}
        <Register
          onSuccess={(token) => {
            navigate({ to: `/verify/${token}` });
          }}
          onNavigate={() => navigate({ to: "/login" })}
          onError={setError}
        />
      </div>
    </div>
  );
}
