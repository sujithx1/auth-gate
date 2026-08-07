import React from "react";
import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  useNavigate,
  redirect,
} from "@tanstack/react-router";
import { QueryClient, useQuery } from "@tanstack/react-query";
import { api } from "./lib/api";
import { Sun, Moon, ShieldCheck } from "lucide-react";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import Dashboard from "./pages/Dashboard";
import Organizations from "./pages/Organizations";
import Clients from "./pages/Clients";

// Create Query Client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

// Fetch user profile session context helper
export async function fetchUserSession() {
  try {
    const res: any = await api.get("/api/auth/me");
    return res.data?.user || null;
  } catch {
    return null;
  }
}

// Root layout component supporting global states
const RootComponent = () => {
  const [isDark, setIsDark] = React.useState(() => {
    const saved = localStorage.getItem("authgate-theme");
    return saved ? saved === "dark" : true;
  });

  React.useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      localStorage.setItem("authgate-theme", next ? "dark" : "light");
      return next;
    });
  };

  // Check if we are on a developer dashboard route to render corresponding header or wrapper
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      <div className="absolute top-6 right-6 z-50">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-secondary border border-border text-muted-foreground hover:text-foreground transition-colors"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
      <Outlet />
    </div>
  );
};

// Define Routes
const rootRoute = createRootRoute({
  component: RootComponent,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => {
    const navigate = useNavigate();
    return <Landing onGoToConsole={async () => {
      const user = await queryClient.fetchQuery({
        queryKey: ["session"],
        queryFn: fetchUserSession,
      });
      if (user) {
        navigate({ to: "/dashboard" });
      } else {
        navigate({ to: "/login" });
      }
    }} />;
  },
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: () => {
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
          <Login
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ["session"] });
              navigate({ to: "/dashboard" });
            }}
            onNavigate={(view) => navigate({ to: view === "register" ? "/register" : "/forgot" })}
            onError={setError}
          />
        </div>
      </div>
    );
  },
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register",
  component: () => {
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
              navigate({ to: "/verify", search: { token } });
            }}
            onNavigate={() => navigate({ to: "/login" })}
            onError={setError}
          />
        </div>
      </div>
    );
  },
});

const verifyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/verify",
  validateSearch: (search: Record<string, unknown>) => ({
    token: (search.token as string) || "",
  }),
  component: () => {
    const navigate = useNavigate();
    const { token } = verifyRoute.useSearch();
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
  },
});

const forgotRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/forgot",
  component: () => {
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
          <ForgotPassword
            onSuccess={(token) => {
              if (token) {
                navigate({ to: "/reset", search: { token } });
              } else {
                navigate({ to: "/login" });
              }
            }}
            onNavigate={() => navigate({ to: "/login" })}
            onError={setError}
          />
        </div>
      </div>
    );
  },
});

const resetRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/reset",
  validateSearch: (search: Record<string, unknown>) => ({
    token: (search.token as string) || "",
  }),
  component: () => {
    const navigate = useNavigate();
    const { token } = resetRoute.useSearch();
    const [error, setError] = React.useState<string | null>(null);
    return (
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-12">
        <div className="w-full max-w-md z-10 space-y-6">
          <div className="flex items-center justify-center gap-2 mb-8 select-none">
            <ShieldCheck className="w-9 h-9 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Auth<span className="text-muted-foreground font-medium">Gate</span></h1>
          </div>
          {error && <div className="p-3 bg-destructive/15 text-destructive border border-destructive/20 rounded-lg text-xs">{error}</div>}
          <ResetPassword
            initialToken={token}
            onSuccess={() => navigate({ to: "/login" })}
            onNavigate={() => navigate({ to: "/login" })}
            onError={setError}
          />
        </div>
      </div>
    );
  },
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  beforeLoad: async () => {
    const user = await queryClient.fetchQuery({
      queryKey: ["session"],
      queryFn: fetchUserSession,
    });
    if (!user) {
      throw redirect({ to: "/login" });
    }
    return { user };
  },
  component: () => {
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
            localStorage.removeItem("authgate-theme");
            navigate({ to: "/login" });
          }}
          onNavigateOrgs={() => navigate({ to: "/orgs" })}
          onNavigateClients={() => navigate({ to: "/clients" })}
          onError={setError}
        />
      </div>
    );
  },
});

const orgsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/orgs",
  beforeLoad: async () => {
    const user = await queryClient.fetchQuery({
      queryKey: ["session"],
      queryFn: fetchUserSession,
    });
    if (!user) {
      throw redirect({ to: "/login" });
    }
  },
  component: () => {
    const navigate = useNavigate();
    const [error, setError] = React.useState<string | null>(null);
    return (
      <div className="p-6 md:p-12 max-w-5xl mx-auto">
        {error && <div className="p-3 bg-destructive/15 text-destructive border border-destructive/20 rounded-lg text-xs mb-4">{error}</div>}
        <Organizations onBack={() => navigate({ to: "/dashboard" })} onError={setError} />
      </div>
    );
  },
});

const clientsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/clients",
  beforeLoad: async () => {
    const user = await queryClient.fetchQuery({
      queryKey: ["session"],
      queryFn: fetchUserSession,
    });
    if (!user) {
      throw redirect({ to: "/login" });
    }
  },
  component: () => {
    const navigate = useNavigate();
    const [error, setError] = React.useState<string | null>(null);
    return (
      <div className="p-6 md:p-12 max-w-5xl mx-auto">
        {error && <div className="p-3 bg-destructive/15 text-destructive border border-destructive/20 rounded-lg text-xs mb-4">{error}</div>}
        <Clients onBack={() => navigate({ to: "/dashboard" })} onError={setError} />
      </div>
    );
  },
});

// Configure Route Tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  registerRoute,
  verifyRoute,
  forgotRoute,
  resetRoute,
  dashboardRoute,
  orgsRoute,
  clientsRoute,
]);

// Create Router instance
export const router = createRouter({
  routeTree,
  context: {
    queryClient,
  },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
