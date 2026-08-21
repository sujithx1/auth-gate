import { useState, useEffect } from "react";
import { 
  ShieldCheck, Laptop, Key, Building2, Server, Cpu, Code, 
  CheckCircle2, Copy, Check, ArrowRight, Sparkles, Terminal, Sun, Moon 
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Link, useNavigate } from "@tanstack/react-router";
import { CodeBlock } from "../components/docs/CodeBlock";

interface LandingProps {
  onGoToConsole: () => void;
}

type TabType = "auth" | "client" | "schema" | "middleware" | "organization" | "plugins";

interface CodeSnippet {
  id: TabType;
  title: string;
  filename: string;
  envBadge: string;
  description: string;
  code: string;
}

const SNIPPETS: Record<TabType, CodeSnippet> = {
  auth: {
    id: "auth",
    title: "Server (auth.ts)",
    filename: "auth.ts",
    envBadge: "DATABASE_URL, AUTH_SECRET",
    description: "Initialize core AuthGate server instance with Drizzle ORM adapter and security rules.",
    code: `import { createAuthGate } from "@authgate/core";
import { drizzleAdapter } from "@authgate/drizzle";
import { db } from "./db/schema";

export const auth = createAuthGate({
  appName: "Acme App",
  secret: process.env.AUTH_SECRET!,
  database: drizzleAdapter(db), // Pluggable ORM Adapter
  session: {
    expiresIn: "30d",
    updateAge: "1d",
    cookie: { secure: true, sameSite: "lax" },
  },
  plugins: [
    organization(),
    twoFactor({ issuer: "Acme Inc" }),
    oauthProviders({ google: true, github: true }),
  ],
});`
  },
  client: {
    id: "client",
    title: "Client (auth-client.ts)",
    filename: "auth-client.ts",
    envBadge: "VITE_API_URL",
    description: "Type-safe React client SDK with reactive session hooks and auth methods.",
    code: `import { createAuthClient } from "@authgate/client";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3005",
});

// React Component Example
export function ProfileCard() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) return <div>Loading session...</div>;
  if (!session) {
    return (
      <button onClick={() => authClient.signIn.social({ provider: "github" })}>
        Sign in with GitHub
      </button>
    );
  }

  return <div>Welcome back, {session.user.name}!</div>;
}`
  },
  schema: {
    id: "schema",
    title: "DB Schema",
    filename: "schema.ts",
    envBadge: "PostgreSQL / SQLite / MySQL",
    description: "Modular Drizzle ORM relational tables for users, sessions, and verification tokens.",
    code: `import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const sessions = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
});`
  },
  middleware: {
    id: "middleware",
    title: "Middleware",
    filename: "middleware.ts",
    envBadge: "Next.js / Hono / Express",
    description: "Protect API routes and pages with automatic session verification middleware.",
    code: `import { defineMiddleware } from "@authgate/core/middleware";
import { auth } from "./auth";

export default defineMiddleware(async ({ request, next }) => {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session && request.url.includes("/dashboard")) {
    return Response.redirect(new URL("/login", request.url));
  }

  return next({ session });
});`
  },
  organization: {
    id: "organization",
    title: "Multi-Tenancy",
    filename: "organization.ts",
    envBadge: "RBAC & Workspaces",
    description: "Manage organizations, workspace switching, roles, and member invitations.",
    code: `import { OrganizationService } from "@authgate/organization";

export const orgService = new OrganizationService({
  defaultRole: "member",
  roles: ["owner", "admin", "member", "guest"],
});

// Create workspace organization
const org = await orgService.createOrganization({
  name: "Acme Engineering",
  slug: "acme-eng",
  userId: session.user.id,
});`
  },
  plugins: {
    id: "plugins",
    title: "Plugins & Delivery",
    filename: "plugins.ts",
    envBadge: "RESEND_API_KEY, TWILIO_AUTH_TOKEN",
    description: "Connect custom email and SMS delivery adapters for magic links & 2FA OTPs.",
    code: `import { createResendAdapter } from "@authgate/email-resend";
import { createTwilioAdapter } from "@authgate/sms-twilio";

export const emailPlugin = createResendAdapter({
  apiKey: process.env.RESEND_API_KEY!,
  from: "AuthGate <auth@yourdomain.com>",
});

export const smsPlugin = createTwilioAdapter({
  accountSid: process.env.TWILIO_ACCOUNT_SID!,
  authToken: process.env.TWILIO_AUTH_TOKEN!,
});`
  }
};

export default function Landing({ onGoToConsole }: LandingProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("auth");
  const [copiedCmd, setCopiedCmd] = useState(false);
  
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("authgate-theme");
      if (saved) return saved === "dark";
      const cookieMatch = document.cookie.match(/(?:^|; )authgate_theme=([^;]*)/);
      if (cookieMatch) return cookieMatch[1] === "dark";
      return document.documentElement.classList.contains("dark");
    }
    return true;
  });

  useEffect(() => {
    const root = document.documentElement;
    const theme = isDark ? "dark" : "light";
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("authgate-theme", theme);
    document.cookie = `authgate_theme=${theme}; path=/; max-age=31536000; SameSite=Lax`;
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  const handleCopyCmd = () => {
    navigator.clipboard.writeText("bun add @authgate/core @authgate/drizzle");
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground font-sans transition-colors duration-200 selection:bg-primary selection:text-primary-foreground">
      
      {/* STICKY TOP NAVBAR */}
      <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md transition-all">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          
          {/* Logo */}
          <div className="flex items-center gap-2.5 font-bold text-lg select-none cursor-pointer" onClick={() => navigate({ to: "/" })}>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border border-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="tracking-tight text-foreground">
              Auth<span className="text-emerald-600 dark:text-emerald-500 font-semibold">Gate</span>
            </span>
            <span className="ml-1 text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
              v3.0
            </span>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#code-showcase" className="hover:text-foreground transition-colors">auth.ts Showcase</a>
            <Link to="/docs" className="hover:text-foreground transition-colors">Developer Docs</Link>
            <a href="https://github.com/sujithx1/auth-gate" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">GitHub</a>
          </nav>

          {/* Action Buttons & Theme Toggle */}
          <div className="flex items-center gap-2.5">
            {/* Light / Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-secondary/80 hover:bg-secondary border border-border text-muted-foreground hover:text-foreground transition-all"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
            </button>

            <Button 
              variant="ghost" 
              size="sm" 
              className="hidden sm:inline-flex text-muted-foreground hover:text-foreground"
              onClick={() => navigate({ to: "/docs" })}
            >
              Docs
            </Button>
            <Button 
              size="sm" 
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-sm rounded-lg px-4"
              onClick={onGoToConsole}
            >
              Console Sign In
            </Button>
          </div>
        </div>
      </header>


      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 border-b border-border/40">
        
        {/* Ambient Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-emerald-500/10 dark:bg-emerald-500/15 blur-[120px] rounded-full pointer-events-none -z-10" />
        
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-8">
          
          {/* Announcement Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-6 animate-pulse select-none">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AuthGate Stage 5 Released — Enterprise IAM Architecture for Bun & Node</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight max-w-4xl text-foreground leading-[1.1]">
            The open-source <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500">AuthGate IAM engine</span> for modern apps
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Declarative <code className="text-foreground font-mono text-sm bg-muted px-1.5 py-0.5 rounded">auth.ts</code> setup, pluggable database ORMs, multi-tenancy out-of-the-box, and a lightweight OAuth 2.1 authorization server.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Button 
              size="lg" 
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-7 rounded-xl shadow-md transition-all flex items-center gap-2"
              onClick={onGoToConsole}
            >
              Go to Console
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="rounded-xl px-7 border-border font-medium hover:bg-muted/50"
              onClick={() => navigate({ to: "/docs" })}
            >
              Explore Docs
            </Button>
          </div>

          {/* Quick Install Pill */}
          <div className="pt-4 flex justify-center">
            <div 
              onClick={handleCopyCmd}
              className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-card border border-border/80 text-xs font-mono text-foreground cursor-pointer hover:border-emerald-500/50 hover:shadow-md transition-all group"
            >
              <Terminal className="w-4 h-4 text-emerald-500" />
              <span>bun add @authgate/core @authgate/drizzle</span>
              <div className="p-1 rounded bg-muted group-hover:bg-emerald-500/10 text-muted-foreground group-hover:text-emerald-500 transition-colors">
                {copiedCmd ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* CODE SHOWCASE SECTION - AUTH.TS PLAYGROUND */}
      <section id="code-showcase" className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono text-emerald-500 font-semibold">
            <Code className="w-3.5 h-3.5" />
            Declarative Codebase Architecture
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Configured in one clean file: <span className="font-mono text-emerald-500">auth.ts</span>
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto">
            Zero boilerplate. Pluggable database adapters, social OAuth providers, multi-tenant RBAC, and client hooks configured in clean TypeScript modules.
          </p>
        </div>

        {/* INTERACTIVE CODE CONTAINER */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* TAB SIDEBAR (DESKTOP) / HORIZONTAL TABS (MOBILE) */}
          <div className="lg:col-span-4 flex flex-col gap-2">
            {(Object.keys(SNIPPETS) as TabType[]).map((tabKey) => {
              const snippet = SNIPPETS[tabKey];
              const isActive = activeTab === tabKey;
              return (
                <button
                  key={tabKey}
                  onClick={() => setActiveTab(tabKey)}
                  className={`group text-left p-4 rounded-xl border transition-all duration-200 flex flex-col gap-1.5 ${
                    isActive
                      ? "border-emerald-500 bg-emerald-500/10 text-foreground shadow-sm"
                      : "border-border/60 bg-card/40 text-muted-foreground hover:border-border hover:bg-card hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold text-xs sm:text-sm tracking-tight flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${isActive ? "bg-emerald-500" : "bg-muted-foreground/30"}`} />
                      {snippet.title}
                    </span>
                    {isActive && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                  </div>
                  <span className="text-xs font-mono text-muted-foreground truncate pl-4">
                    {snippet.filename}
                  </span>
                </button>
              );
            })}
          </div>

          {/* CODE EDITOR MOCKUP WINDOW */}
          <div className="lg:col-span-8 rounded-2xl border border-border bg-card shadow-2xl overflow-hidden relative">
            
            {/* Window Topbar */}
            <div className="h-12 bg-muted/80 border-b border-border flex items-center justify-between px-4 select-none">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/90 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500/90 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/90 inline-block" />
                <div className="ml-3 text-xs font-mono font-semibold text-foreground/90 flex items-center gap-2 bg-background/60 px-3 py-1 rounded-md border border-border/40">
                  <Code className="w-3.5 h-3.5 text-emerald-500" />
                  src/{SNIPPETS[activeTab].filename}
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-500/10 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {SNIPPETS[activeTab].envBadge}
              </div>
            </div>

            {/* Snippet Description bar */}
            <div className="px-5 py-2.5 bg-muted/30 border-b border-border/50 text-xs text-muted-foreground font-mono flex items-center justify-between">
              <span>{SNIPPETS[activeTab].description}</span>
            </div>

            {/* Code Block Content */}
            <div className="p-4 sm:p-6 bg-card/90">
              <CodeBlock 
                className="bg-transparent border-0 text-foreground text-xs sm:text-sm font-mono leading-relaxed overflow-x-auto"
                code={SNIPPETS[activeTab].code} 
              />
            </div>

          </div>

        </div>
      </section>

      {/* BENTO FEATURE GRID */}
      <section id="features" className="py-16 md:py-24 bg-muted/20 border-t border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Built for enterprise power. Designed for developer simplicity.
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              AuthGate brings together complete user authentication, session security, multi-tenancy, and OAuth 2.1 identity in one cohesive framework.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Feature 1 */}
            <div className="p-7 rounded-2xl border border-border/80 bg-card hover:border-emerald-500/50 hover:shadow-lg transition-all duration-300 space-y-4 group">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                <Laptop className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <span className="text-xs font-mono text-muted-foreground">01 / FRAMEWORKS</span>
                <h3 className="font-bold text-lg">Works with your stack</h3>
                <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                  Bun, Hono, Next.js, Express, Fastify, Nuxt, SvelteKit, and Deno supported natively without runtime bloat.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="p-7 rounded-2xl border border-border/80 bg-card hover:border-emerald-500/50 hover:shadow-lg transition-all duration-300 space-y-4 group">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                <Server className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <span className="text-xs font-mono text-muted-foreground">02 / DATABASE</span>
                <h3 className="font-bold text-lg">Bring Your Own Database</h3>
                <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                  PostgreSQL, MySQL, and SQLite adapters powered by Drizzle ORM or custom repository contracts.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="p-7 rounded-2xl border border-border/80 bg-card hover:border-emerald-500/50 hover:shadow-lg transition-all duration-300 space-y-4 group">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                <Key className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <span className="text-xs font-mono text-muted-foreground">03 / CREDENTIALS</span>
                <h3 className="font-bold text-lg">Credential & Session Auth</h3>
                <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                  Argon2id password hashing, email verification, 2FA TOTP, and remote session revocation included natively.
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="p-7 rounded-2xl border border-border/80 bg-card hover:border-emerald-500/50 hover:shadow-lg transition-all duration-300 space-y-4 group">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <span className="text-xs font-mono text-muted-foreground">04 / MULTI-TENANCY</span>
                <h3 className="font-bold text-lg">Multi-Tenancy & RBAC</h3>
                <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                  Organizations, workspace switching, flexible role definitions, invitations, and access control policies.
                </p>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="p-7 rounded-2xl border border-border/80 bg-card hover:border-emerald-500/50 hover:shadow-lg transition-all duration-300 space-y-4 group">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <span className="text-xs font-mono text-muted-foreground">05 / PROTOCOLS</span>
                <h3 className="font-bold text-lg">OAuth 2.1 & PKCE</h3>
                <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                  Deploy your own OAuth authorization server, issue code grants, and connect social providers easily.
                </p>
              </div>
            </div>

            {/* Feature 6 */}
            <div className="p-7 rounded-2xl border border-border/80 bg-card hover:border-emerald-500/50 hover:shadow-lg transition-all duration-300 space-y-4 group">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                <Cpu className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <span className="text-xs font-mono text-muted-foreground">06 / INFRASTRUCTURE</span>
                <h3 className="font-bold text-lg">Decoupled Delivery</h3>
                <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                  Pluggable adapters for Resend, SendGrid, and Twilio. AuthGate manages auth state, you choose delivery.
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 border-t border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5 font-bold text-base select-none">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <span>Auth<span className="text-emerald-500">Gate</span></span>
            <span className="text-xs text-muted-foreground font-normal ml-2">© 2026 AuthGate. Open Source under MIT.</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-muted-foreground font-medium">
            <Link to="/docs" className="hover:text-foreground transition-colors">Documentation</Link>
            <a href="https://github.com/sujithx1/auth-gate" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors flex items-center gap-1.5">
              <span>GitHub</span>
              <svg className="w-4 h-4 fill-current inline" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"></path></svg>
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}

