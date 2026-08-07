import { useState, useEffect } from "react";
import { ShieldCheck, AlertCircle, MailCheck, Sun, Moon } from "lucide-react";
import { api } from "./lib/api";

import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Organizations from "./pages/Organizations";
import Clients from "./pages/Clients";
import Landing from "./pages/Landing";

type View = "landing" | "login" | "register" | "verify" | "forgot" | "reset" | "dashboard" | "orgs" | "clients";

interface UserProfile {
  id: string;
  email: string;
  isEmailVerified: boolean;
  createdAt: string;
}

export default function App() {
  const [view, setView] = useState<View>("landing");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("authgate-theme");
    return saved ? saved === "dark" : true;
  });
  
  // Tokens (pre-filled from verification and reset actions)
  const [sharedToken, setSharedToken] = useState("");

  useEffect(() => {
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

  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Check if session exists on boot
  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    try {
      const data: any = await api.get("/api/auth/me");
      if (data.success) {
        setUser(data.data.user);
        setView("dashboard");
      }
    } catch (e) {
      console.log("No active session detected.");
    }
  }

  const triggerNavigate = (nextView: View) => {
    setError(null);
    setInfo(null);
    setView(nextView);
  };

  const handleAuthSuccess = (userData: UserProfile) => {
    setUser(userData);
    setError(null);
    setInfo(null);
    setView("dashboard");
  };

  const handleRegisterSuccess = (token: string, message: string) => {
    setSharedToken(token);
    setInfo(message);
    setError(null);
    setView("verify");
  };

  const handleForgotSuccess = (token: string | null, message: string) => {
    setInfo(message);
    setError(null);
    if (token) {
      setSharedToken(token);
      setView("reset");
    } else {
      setView("login");
    }
  };

  const handleNotification = (message: string) => {
    setInfo(message);
    setError(null);
    setView("login");
  };

  const handleErr = (message: string) => {
    setError(message);
    setInfo(null);
  };

  const handleLogoutSuccess = () => {
    setUser(null);
    setError(null);
    setInfo("Logged out successfully.");
    localStorage.removeItem("authgate-theme");
    setIsDark(true); // reset back to default dark theme
    setView("login");
  };

  if (view === "landing") {
    return <Landing onGoToConsole={() => triggerNavigate(user ? "dashboard" : "login")} />;
  }

  if (view === "dashboard" && user) {
    return (
      <div className="min-h-screen bg-background text-foreground transition-colors duration-200 p-6">
        <div className="absolute top-6 right-6 z-50">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-secondary border border-border text-muted-foreground hover:text-foreground transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
        <Dashboard user={user} onLogout={handleLogoutSuccess} onNavigateOrgs={() => triggerNavigate("orgs")} onNavigateClients={() => triggerNavigate("clients")} onError={handleErr} />
      </div>
    );
  }

  if (view === "orgs") {
    return (
      <div className="min-h-screen bg-background text-foreground transition-colors duration-200 p-6 md:p-12">
        <div className="absolute top-6 right-6 z-50">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-secondary border border-border text-muted-foreground hover:text-foreground transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
        <div className="max-w-5xl mx-auto">
          <Organizations onBack={() => triggerNavigate("dashboard")} onError={handleErr} />
        </div>
      </div>
    );
  }

  if (view === "clients") {
    return (
      <div className="min-h-screen bg-background text-foreground transition-colors duration-200 p-6 md:p-12">
        <div className="absolute top-6 right-6 z-50">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-secondary border border-border text-muted-foreground hover:text-foreground transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
        <div className="max-w-5xl mx-auto">
          <Clients onBack={() => triggerNavigate("dashboard")} onError={handleErr} />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background text-foreground px-4 py-12 transition-colors duration-200">
      <div className="absolute top-6 right-6 z-50">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-secondary border border-border text-muted-foreground hover:text-foreground transition-colors"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-primary/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        <div className="flex items-center justify-center gap-2 mb-8 select-none">
          <ShieldCheck className="w-9 h-9 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Auth<span className="text-muted-foreground font-medium">Gate</span></h1>
        </div>

        {error && (
          <div className="mb-4 p-4 rounded-lg bg-red-950/40 border border-red-800 text-red-200 text-sm flex gap-2 items-center">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {info && (
          <div className="mb-4 p-4 rounded-lg bg-purple-950/30 border border-purple-800/80 text-purple-200 text-sm flex gap-2 items-center">
            <MailCheck className="w-4 h-4 shrink-0 text-purple-400" />
            <span>{info}</span>
          </div>
        )}

        {view === "login" && (
          <Login onSuccess={handleAuthSuccess} onNavigate={triggerNavigate} onError={handleErr} />
        )}
        {view === "register" && (
          <Register onSuccess={handleRegisterSuccess} onNavigate={triggerNavigate} onError={handleErr} />
        )}
        {view === "verify" && (
          <VerifyEmail initialToken={sharedToken} onSuccess={handleNotification} onNavigate={triggerNavigate} onError={handleErr} />
        )}
        {view === "forgot" && (
          <ForgotPassword onSuccess={handleForgotSuccess} onNavigate={triggerNavigate} onError={handleErr} />
        )}
        {view === "reset" && (
          <ResetPassword initialToken={sharedToken} onSuccess={handleNotification} onNavigate={triggerNavigate} onError={handleErr} />
        )}
      </div>
    </div>
  );
}
