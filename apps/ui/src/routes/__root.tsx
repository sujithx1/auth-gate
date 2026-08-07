import React from "react";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Sun, Moon } from "lucide-react";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
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
}
