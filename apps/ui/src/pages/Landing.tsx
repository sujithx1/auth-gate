import { useState } from "react";
import { ShieldCheck, Laptop, Key, Building2, Server, Shield, Cpu, Code, CheckCircle2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Link, useNavigate } from "@tanstack/react-router";
import { CodeBlock } from "../components/docs/CodeBlock";

interface LandingProps {
  onGoToConsole: () => void;
}

type TabType = "config" | "db" | "oauth" | "integrations";

interface CodeSnippet {
  id: TabType;
  title: string;
  filename: string;
  envBadge: string;
  description: string;
  code: string;
}

const SNIPPETS: Record<TabType, CodeSnippet> = {
  config: {
    id: "config",
    title: "Declarative Config",
    filename: "auth.config.ts",
    envBadge: "PORT, AUTH_SECRET, VITE_API_URL",
    description: "Initialize AuthGate declaratively with environment configuration.",
    code: `import { createAuthGate } from "@authgate/core";

export const authGate = createAuthGate({
  port: Number(process.env.PORT) || 3005,
  secret: process.env.AUTH_SECRET, // JWT & Cookie Signing Secret
  baseUrl: process.env.VITE_API_URL || "http://localhost:3005",
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(",") || [],
  environment: process.env.NODE_ENV || "development",
});`
  },
  db: {
    id: "db",
    title: "Bring Your Own DB",
    filename: "db.config.ts",
    envBadge: "DATABASE_URL (Postgres, MySQL, SQLite)",
    description: "Plug in your own database via environment variables using Drizzle or ORM adapter.",
    code: `import { drizzleAdapter } from "@authgate/drizzle";
import { createAuthGate } from "@authgate/core";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// Client passes their DB connection string from process.env
const sql = postgres(process.env.DATABASE_URL!, { max: 10 });
const db = drizzle(sql);

export const authGate = createAuthGate({
  // Pluggable DB Adapter - Bring Your Own Database!
  database: drizzleAdapter(db),
});`
  },
  oauth: {
    id: "oauth",
    title: "OAuth Providers",
    filename: "oauth.config.ts",
    envBadge: "GOOGLE_CLIENT_ID, GITHUB_CLIENT_SECRET",
    description: "Configure third-party social authentication with environment credentials.",
    code: `import { OAuthService } from "@authgate/oauth";

// Client configures provider credentials via process.env
export const oauth = new OAuthService({
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    redirectUri: \`\${process.env.VITE_API_URL}/api/oauth/google/callback\`,
  },
  github: {
    clientId: process.env.GITHUB_CLIENT_ID!,
    clientSecret: process.env.GITHUB_CLIENT_SECRET!,
  },
});`
  },
  integrations: {
    id: "integrations",
    title: "Integrations",
    filename: "integrations.config.ts",
    envBadge: "RESEND_API_KEY, TWILIO_AUTH_TOKEN",
    description: "Connect custom email and SMS delivery providers seamlessly.",
    code: `import { AuthGateClient } from "@authgate/client";

export const auth = new AuthGateClient({
  apiUrl: process.env.VITE_API_URL,
  // Custom Email & SMS delivery adapters configured via .env
  emailProvider: {
    apiKey: process.env.RESEND_API_KEY,
    from: process.env.EMAIL_FROM || "auth@yourdomain.com",
  },
  smsProvider: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
  },
});`
  }
};

export default function Landing({ onGoToConsole }: LandingProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("config");

  return (
    <div className="flex flex-col md:flex-row min-h-screen w-full bg-background text-foreground overflow-hidden font-sans transition-colors duration-200">
      
      {/* LEFT PANEL - FIXED ON DESKTOP */}
      <div className="w-full md:w-[45%] md:h-screen flex flex-col justify-between p-8 md:p-12 lg:p-16 border-b md:border-b-0 md:border-r border-border relative z-10 overflow-hidden">
        {/* Background Image Layer */}
        <div 
          className="absolute inset-0 z-[-1] opacity-20 dark:opacity-30 pointer-events-none transition-opacity"
          style={{ 
            backgroundImage: "url('/auth-bg.png')", 
            backgroundSize: "cover", 
            backgroundPosition: "center" 
          }} 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 to-background z-[-1] pointer-events-none" />

        {/* Top: Logo */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl select-none">
            <ShieldCheck className="w-7 h-7 text-primary" />
            <span>Auth<span className="text-muted-foreground font-medium">Gate</span></span>
          </div>
        </div>

        {/* Middle: Hero Content */}
        <div className="space-y-8 my-16 md:my-0">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary border border-border text-xs font-semibold text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Announcement | AuthGate Stage 3 Released &rarr;
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1]">
            The most comprehensive authentication framework
          </h1>

          <div className="flex flex-wrap gap-4 pt-4">
            <Button size="lg" className="rounded-md font-semibold px-8" onClick={() => navigate({ to: "/docs" })}>
              Get Started
            </Button>
            <Button size="lg" variant="outline" className="rounded-md px-8 border-border" onClick={onGoToConsole}>
              Sign In
            </Button>
          </div>
        </div>

        {/* Bottom: Links */}
        <div className="flex items-center gap-6 text-xs text-muted-foreground font-medium">
          <a href="#" className="hover:text-foreground transition-colors">Community</a>
          <a href="#" className="hover:text-foreground transition-colors">Changelog</a>
          <a href="#" className="hover:text-foreground transition-colors">Legal</a>
          <div className="flex-1" />
          <a href="https://github.com/sujithx1/auth-gate" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"></path></svg>
          </a>
        </div>
      </div>

      {/* RIGHT PANEL - SCROLLABLE */}
      <div className="w-full md:w-[55%] md:h-screen md:overflow-y-auto bg-muted/20">
        
        {/* Centered Top Nav inside right panel */}
        <div className="hidden md:flex justify-center p-6 border-b border-border">
           <Link to="/docs" className="text-sm font-bold tracking-widest hover:text-primary transition-colors uppercase">DEVELOPER DOCS</Link>
        </div>

        <div className="p-8 md:p-12 lg:p-16 space-y-24">
           {/* Bento Grid */}
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="p-6 border border-border bg-card/40 rounded-xl hover:border-primary/50 transition-colors space-y-4">
                 <div className="text-muted-foreground text-xs font-mono">01</div>
                 <h3 className="font-bold text-sm">Works with your stack.</h3>
                 <p className="text-muted-foreground text-xs leading-relaxed">
                   Next.js, Nuxt, SvelteKit, Bun, Hono, Express, Deno, and 20+ more frameworks out-of-the-box.
                 </p>
                 <div className="flex gap-3 text-muted-foreground pt-2">
                    <Laptop className="w-4 h-4" /> <Server className="w-4 h-4" /> <Code className="w-4 h-4" />
                 </div>
              </div>

              <div className="p-6 border border-border bg-card/40 rounded-xl hover:border-primary/50 transition-colors space-y-4">
                 <div className="text-muted-foreground text-xs font-mono">02</div>
                 <h3 className="font-bold text-sm">Built-in credential auth.</h3>
                 <p className="text-muted-foreground text-xs leading-relaxed">
                   Sessions, email verification, 2FA, password reset, and session remote revocation included natively.
                 </p>
                 <div className="flex gap-3 text-muted-foreground pt-2">
                    <Key className="w-4 h-4" /> <Shield className="w-4 h-4" />
                 </div>
              </div>

              <div className="p-6 border border-border bg-card/40 rounded-xl hover:border-primary/50 transition-colors space-y-4">
                 <div className="text-muted-foreground text-xs font-mono">03</div>
                 <h3 className="font-bold text-sm">Multi-tenancy built in.</h3>
                 <p className="text-muted-foreground text-xs leading-relaxed">
                   Organizations, flexible RBAC roles, invitations, and modular workspace access control policies.
                 </p>
                 <div className="flex gap-3 text-muted-foreground pt-2">
                    <Building2 className="w-4 h-4" />
                 </div>
              </div>

              <div className="p-6 border border-border bg-card/40 rounded-xl hover:border-primary/50 transition-colors space-y-4">
                 <div className="text-muted-foreground text-xs font-mono">04</div>
                 <h3 className="font-bold text-sm">OAuth 2.1 & PKCE.</h3>
                 <p className="text-muted-foreground text-xs leading-relaxed">
                   Deploy your own authorization server, issue codes, manage third-party clients and integrations.
                 </p>
                 <div className="flex gap-3 text-muted-foreground pt-2">
                    <ShieldCheck className="w-4 h-4" />
                 </div>
              </div>

              <div className="p-6 border border-border bg-card/40 rounded-xl hover:border-primary/50 transition-colors space-y-4 sm:col-span-2">
                 <div className="text-muted-foreground text-xs font-mono">05</div>
                 <h3 className="font-bold text-sm">Decoupled OTP & Infrastructure.</h3>
                 <p className="text-muted-foreground text-xs leading-relaxed max-w-xl">
                   Separate generation and verification from delivery. Connect SendGrid, Twilio, or any provider. AuthGate handles the state, you handle the transport.
                 </p>
                 <div className="flex gap-3 text-muted-foreground pt-2">
                    <Cpu className="w-4 h-4" />
                 </div>
              </div>

           </div>

           {/* Framework Section */}
           <div className="space-y-8 pb-16 border-t border-border pt-16">
              <div className="space-y-2">
                 <h2 className="text-2xl font-bold tracking-tight">Framework Configuration</h2>
                 <p className="text-muted-foreground text-sm">
                   Bring your own database, secrets, and provider credentials using environment variables (<code className="text-primary font-mono text-xs">.env</code>).
                 </p>
              </div>

              <div className="flex flex-col lg:flex-row gap-6 items-start">
                 {/* Code Editor Mockup Window (Docker / macOS style) */}
                 <div className="flex-1 w-full rounded-xl border border-border/80 bg-card overflow-hidden shadow-2xl relative transition-all duration-300">
                    
                    {/* Top Window Bar */}
                    <div className="h-11 bg-muted/60 border-b border-border flex items-center justify-between px-4 select-none">
                       <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                          <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                          <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                          <span className="ml-2 text-xs font-mono font-medium text-foreground/80 flex items-center gap-1.5">
                             <Code className="w-3.5 h-3.5 text-primary" />
                             {SNIPPETS[activeTab].filename}
                          </span>
                       </div>

                       <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary/80 text-[11px] font-mono text-muted-foreground border border-border/50">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          .env: {SNIPPETS[activeTab].envBadge}
                       </div>
                    </div>

                    {/* Subtitle / Description bar */}
                    <div className="px-4 py-2 bg-muted/20 border-b border-border/40 text-xs text-muted-foreground font-mono flex items-center justify-between">
                       <span>{SNIPPETS[activeTab].description}</span>
                    </div>

                    {/* Code Block Content */}
                    <div className="p-4 bg-card/60">
                      <CodeBlock 
                        className="bg-transparent border-0 text-foreground overflow-x-auto leading-relaxed text-xs font-mono"
                        code={SNIPPETS[activeTab].code} 
                      />
                    </div>
                 </div>

                 {/* Interactive Navigation Sidebar Buttons */}
                 <div className="w-full lg:w-56 flex flex-col gap-2.5 pt-1">
                    {(Object.keys(SNIPPETS) as TabType[]).map((tabKey) => {
                      const snippet = SNIPPETS[tabKey];
                      const isActive = activeTab === tabKey;
                      return (
                        <button
                          key={tabKey}
                          onClick={() => setActiveTab(tabKey)}
                          className={`group text-left p-3 rounded-lg border text-xs transition-all duration-200 flex flex-col gap-1 ${
                            isActive
                              ? "border-primary bg-primary/10 text-foreground font-semibold shadow-sm"
                              : "border-border/60 bg-card/30 text-muted-foreground hover:border-border hover:bg-card/70 hover:text-foreground"
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                             <span className="uppercase tracking-wider font-mono text-[11px]">{snippet.title}</span>
                             {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-primary" />}
                          </div>
                          <span className="text-[10px] font-mono text-muted-foreground/80 truncate">
                            {snippet.filename}
                          </span>
                        </button>
                      );
                    })}
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

