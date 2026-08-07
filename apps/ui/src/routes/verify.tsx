import React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import VerifyEmail from "../pages/VerifyEmail";

export interface VerifySearchParams {
  token?: string;
}

export const Route = createFileRoute("/verify")({
  validateSearch: (search: Record<string, unknown>): VerifySearchParams => ({
    token: (search.token as string) || undefined,
  }),
  component: VerifyComponent,
});

function VerifyComponent() {
  const navigate = useNavigate();
  const { token } = Route.useSearch();
  const [error, setError] = React.useState<string | null>(null);
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-12">
      <div className="w-full max-w-md z-10 space-y-6">
        <div className="flex items-center justify-center gap-2 mb-8 select-none">
          <ShieldCheck className="w-9 h-9 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Auth<span className="text-muted-foreground font-medium">Gate</span></h1>
        </div>
        {error && <div className="p-3 bg-destructive/15 text-destructive border border-destructive/20 rounded-lg text-xs">{error}</div>}
        <VerifyEmail
          initialToken={token}
          onSuccess={() => navigate({ to: "/login" })}
          onNavigate={() => navigate({ to: "/login" })}
          onError={setError}
        />
      </div>
    </div>
  );
}
