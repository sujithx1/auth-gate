import { ShieldCheck, Laptop, Key, Building2, Server, Shield, Cpu, Code } from "lucide-react";
import { Button } from "../components/ui/button";
import { Link, useNavigate } from "@tanstack/react-router";

interface LandingProps {
  onGoToConsole: () => void;
}

export default function Landing({ onGoToConsole }: LandingProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col md:flex-row min-h-screen w-full bg-black text-slate-200 overflow-hidden font-sans">
      
      {/* LEFT PANEL - FIXED ON DESKTOP */}
      <div className="w-full md:w-[45%] md:h-screen flex flex-col justify-between p-8 md:p-12 lg:p-16 border-b md:border-b-0 md:border-r border-slate-800 relative z-10 bg-black">
        
        {/* Top: Logo */}
        <div className="flex items-center gap-2 font-bold text-xl select-none text-white">
          <ShieldCheck className="w-7 h-7 text-indigo-500" />
          <span>Auth<span className="text-slate-400 font-medium">Gate</span></span>
        </div>

        {/* Middle: Hero Content */}
        <div className="space-y-8 my-16 md:my-0">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            Announcement | AuthGate Stage 3 Released &rarr;
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
            The most comprehensive authentication framework
          </h1>

          <div className="flex flex-wrap gap-4 pt-4">
            <Button size="lg" className="bg-white text-black hover:bg-slate-200 rounded-md font-semibold px-8" onClick={() => navigate({ to: "/docs" })}>
              Get Started
            </Button>
            <Button size="lg" variant="outline" className="border-slate-700 bg-transparent text-white hover:bg-slate-900 hover:text-white rounded-md px-8" onClick={onGoToConsole}>
              Sign In
            </Button>
          </div>
        </div>

        {/* Bottom: Links */}
        <div className="flex items-center gap-6 text-xs text-slate-500 font-medium">
          <a href="#" className="hover:text-slate-300 transition-colors">Community</a>
          <a href="#" className="hover:text-slate-300 transition-colors">Changelog</a>
          <a href="#" className="hover:text-slate-300 transition-colors">Legal</a>
          <div className="flex-1" />
          <a href="https://github.com/sujithx/authgate" target="_blank" rel="noreferrer" className="hover:text-slate-300">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"></path></svg>
          </a>
        </div>
      </div>

      {/* RIGHT PANEL - SCROLLABLE */}
      <div className="w-full md:w-[55%] md:h-screen md:overflow-y-auto bg-[#050505]">
        
        {/* Top Nav inside right panel */}
        <div className="hidden md:flex items-center justify-end p-6 gap-8 text-xs font-semibold text-slate-500 border-b border-slate-800/50">
           <a href="#" className="hover:text-white transition-colors">README</a>
           <Link to="/docs" className="hover:text-white transition-colors">DOCS</Link>
           <a href="#" className="hover:text-white transition-colors">ENTERPRISE</a>
           <a href="#" className="hover:text-white transition-colors">PRODUCTS</a>
        </div>

        <div className="p-8 md:p-12 lg:p-16 space-y-24">
           {/* Bento Grid */}
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="p-6 border border-slate-800/60 bg-slate-900/20 rounded-xl hover:border-slate-700 transition-colors space-y-4">
                 <div className="text-slate-600 text-xs font-mono">01</div>
                 <h3 className="text-white font-bold text-sm">Works with your stack.</h3>
                 <p className="text-slate-400 text-xs leading-relaxed">
                   Next.js, Nuxt, SvelteKit, Bun, Hono, Express, Deno, and 20+ more frameworks out-of-the-box.
                 </p>
                 <div className="flex gap-3 text-slate-600 pt-2">
                    <Laptop className="w-4 h-4" /> <Server className="w-4 h-4" /> <Code className="w-4 h-4" />
                 </div>
              </div>

              <div className="p-6 border border-slate-800/60 bg-slate-900/20 rounded-xl hover:border-slate-700 transition-colors space-y-4">
                 <div className="text-slate-600 text-xs font-mono">02</div>
                 <h3 className="text-white font-bold text-sm">Built-in credential auth.</h3>
                 <p className="text-slate-400 text-xs leading-relaxed">
                   Sessions, email verification, 2FA, password reset, and session remote revocation included natively.
                 </p>
                 <div className="flex gap-3 text-slate-600 pt-2">
                    <Key className="w-4 h-4" /> <Shield className="w-4 h-4" />
                 </div>
              </div>

              <div className="p-6 border border-slate-800/60 bg-slate-900/20 rounded-xl hover:border-slate-700 transition-colors space-y-4">
                 <div className="text-slate-600 text-xs font-mono">03</div>
                 <h3 className="text-white font-bold text-sm">Multi-tenancy built in.</h3>
                 <p className="text-slate-400 text-xs leading-relaxed">
                   Organizations, flexible RBAC roles, invitations, and modular workspace access control policies.
                 </p>
                 <div className="flex gap-3 text-slate-600 pt-2">
                    <Building2 className="w-4 h-4" />
                 </div>
              </div>

              <div className="p-6 border border-slate-800/60 bg-slate-900/20 rounded-xl hover:border-slate-700 transition-colors space-y-4">
                 <div className="text-slate-600 text-xs font-mono">04</div>
                 <h3 className="text-white font-bold text-sm">OAuth 2.1 & PKCE.</h3>
                 <p className="text-slate-400 text-xs leading-relaxed">
                   Deploy your own authorization server, issue codes, manage third-party clients and integrations.
                 </p>
                 <div className="flex gap-3 text-slate-600 pt-2">
                    <ShieldCheck className="w-4 h-4" />
                 </div>
              </div>

              <div className="p-6 border border-slate-800/60 bg-slate-900/20 rounded-xl hover:border-slate-700 transition-colors space-y-4 sm:col-span-2">
                 <div className="text-slate-600 text-xs font-mono">05</div>
                 <h3 className="text-white font-bold text-sm">Decoupled OTP & Infrastructure.</h3>
                 <p className="text-slate-400 text-xs leading-relaxed max-w-xl">
                   Separate generation and verification from delivery. Connect SendGrid, Twilio, or any provider. AuthGate handles the state, you handle the transport.
                 </p>
                 <div className="flex gap-3 text-slate-600 pt-2">
                    <Cpu className="w-4 h-4" />
                 </div>
              </div>

           </div>

           {/* Framework Section */}
           <div className="space-y-8 pb-16 border-t border-slate-800/50 pt-16">
              <div className="space-y-2">
                 <h2 className="text-2xl font-bold text-white tracking-tight">Framework</h2>
                 <p className="text-slate-400 text-sm">The most comprehensive authentication framework for TypeScript.</p>
              </div>

              <div className="flex flex-col lg:flex-row gap-8">
                 <div className="flex-1 rounded-xl border border-slate-800/60 bg-black overflow-hidden relative shadow-2xl">
                    <div className="h-12 bg-slate-900/40 border-b border-slate-800/60 flex items-center px-4">
                       <span className="text-xs text-slate-400 font-mono flex items-center gap-2"><Code className="w-4 h-4" /> auth.ts</span>
                    </div>
                    <div className="p-6 font-mono text-xs text-slate-300 overflow-x-auto leading-loose">
<pre>{`import { AuthGateClient } from "@sujithx/authgate"

export const auth = new AuthGateClient({
  baseUrl: "http://localhost:3005",
  credentials: "include",
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    },
  },
  plugins: [
    twoFactor(),
    otpMediator()
  ]
})`}</pre>
                    </div>
                 </div>

                 <div className="w-full lg:w-48 flex flex-col gap-6 text-[10px] font-bold text-slate-500 tracking-[0.15em] pt-4">
                    <button className="text-left text-white border-l-[3px] border-indigo-500 pl-4 py-1 uppercase transition-colors">
                       Declarative Config
                    </button>
                    <button className="text-left border-l-[3px] border-transparent hover:border-slate-700 hover:text-slate-300 pl-4 py-1 uppercase transition-colors">
                       Bring Your Own DB
                    </button>
                    <button className="text-left border-l-[3px] border-transparent hover:border-slate-700 hover:text-slate-300 pl-4 py-1 uppercase transition-colors">
                       OAuth Providers
                    </button>
                    <button className="text-left border-l-[3px] border-transparent hover:border-slate-700 hover:text-slate-300 pl-4 py-1 uppercase transition-colors">
                       Integrations
                    </button>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
