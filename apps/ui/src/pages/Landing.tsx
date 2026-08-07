import React, { useState } from "react";
import { ShieldCheck, Sun, Moon, Laptop, Key, Building2, ChevronRight, Copy, Check, Code, BookOpen, Terminal } from "lucide-react";
import { Button } from "../components/ui/button";

interface LandingProps {
  onGoToConsole: () => void;
}

export default function Landing({ onGoToConsole }: LandingProps) {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("authgate-theme");
    return saved ? saved === "dark" : true;
  });
  const [activeTab, setActiveTab] = useState<"install" | "client" | "usage">("install");
  const [copiedText, setCopiedText] = useState(false);

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

  const copyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const codeSnippets = {
    install: "bun add @sujithx/authgate",
    client: `import { AuthGateClient } from "@sujithx/authgate";

export const auth = new AuthGateClient({
  baseUrl: "http://localhost:3005"
});`,
    usage: `// 1. Sign in a user
const session = await auth.login("user@example.com", "securepassword123");

// 2. Fetch authenticated user profile context
const { data } = await auth.me();
console.log("Welcome back", data.user.email);`
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      {/* Navigation Header */}
      <header className="border-b border-border/40 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg select-none">
            <ShieldCheck className="w-6 h-6 text-primary" />
            <span>Auth<span className="text-muted-foreground font-medium">Gate</span></span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <Button variant="outline" size="sm" onClick={onGoToConsole} className="border-border">
              Developer Console
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container max-w-5xl mx-auto px-4 pt-20 pb-16 text-center space-y-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-xs font-semibold text-muted-foreground border border-border/50">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          AuthGate Stage 3 Release
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight max-w-3xl mx-auto leading-[1.1]">
          The complete open-source <span className="bg-gradient-to-r from-purple-500 to-indigo-500 bg-clip-text text-transparent">auth infrastructure</span> for developers
        </h1>

        <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto font-medium">
          A modular, type-safe authentication library and server supporting RBAC, organizations, and full OAuth 2.1 specifications with PKCE verification out-of-the-box.
        </p>

        <div className="flex justify-center gap-4 pt-4">
          <Button size="lg" onClick={onGoToConsole} className="px-8 shadow-sm">
            Launch Console <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
          <Button size="lg" variant="outline" onClick={() => {
            document.getElementById("docs-section")?.scrollIntoView({ behavior: "smooth" });
          }} className="px-8 border-border">
            View Docs
          </Button>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="border-y border-border/40 bg-muted/30 py-16">
        <div className="container max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3 p-5 rounded-xl border border-border bg-card">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">Multi-Tenancy</h3>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Create organizations, invite team members using secure tokens, and partition workspaces natively.
            </p>
          </div>

          <div className="space-y-3 p-5 rounded-xl border border-border bg-card">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Key className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">Flexible RBAC</h3>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Define custom roles and permissions, map them, and protect Hono server routes with middleware guards.
            </p>
          </div>

          <div className="space-y-3 p-5 rounded-xl border border-border bg-card">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Laptop className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">OAuth 2.1 server</h3>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Register third-party client apps, issue authorization codes, and enforce secure PKCE code challenge verification.
            </p>
          </div>
        </div>
      </section>

      {/* Docs / Code Playground Section */}
      <section id="docs-section" className="container max-w-4xl mx-auto px-4 py-20 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Developer Guide</h2>
          <p className="text-muted-foreground text-sm">Get up and running with the client SDK in seconds</p>
        </div>

        <div className="border border-border rounded-xl overflow-hidden bg-card shadow-lg">
          <div className="flex border-b border-border bg-muted/50 px-4 h-12 items-center justify-between">
            <div className="flex gap-2 text-xs font-semibold">
              <button
                onClick={() => { setActiveTab("install"); }}
                className={`px-3 py-1.5 rounded-md transition-colors ${activeTab === "install" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                1. Install
              </button>
              <button
                onClick={() => { setActiveTab("client"); }}
                className={`px-3 py-1.5 rounded-md transition-colors ${activeTab === "client" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                2. Initialize
              </button>
              <button
                onClick={() => { setActiveTab("usage"); }}
                className={`px-3 py-1.5 rounded-md transition-colors ${activeTab === "usage" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                3. Usage
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => copyCode(codeSnippets[activeTab])}
              className="h-8 border-border text-muted-foreground"
            >
              {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
              Copy
            </Button>
          </div>
          <div className="p-6 bg-slate-950 font-mono text-sm leading-relaxed text-slate-300 overflow-x-auto select-all">
            <pre>{codeSnippets[activeTab]}</pre>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 text-center text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} AuthGate open-source library. Apache-2.0 License.</p>
      </footer>
    </div>
  );
}
