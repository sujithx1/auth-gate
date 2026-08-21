import { useState } from "react";
import { BookOpen, Terminal, ShieldCheck, Shield, Cpu, Laptop, KeyRound, Building2, Key } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { IntroDoc } from "../components/docs/IntroDoc";
import { SetupDoc } from "../components/docs/SetupDoc";
import { CredentialsDoc } from "../components/docs/CredentialsDoc";
import { OrgDoc } from "../components/docs/OrgDoc";
import { OAuthClientDoc } from "../components/docs/OAuthClientDoc";
import { TwoFactorDoc } from "../components/docs/TwoFactorDoc";
import { OtpDoc } from "../components/docs/OtpDoc";
import { SocialDoc } from "../components/docs/SocialDoc";
import { OidcDoc } from "../components/docs/OidcDoc";
import { Link } from "@tanstack/react-router";

export default function Docs() {
  const [docSection, setDocSection] = useState<string>("intro");

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 px-4 py-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">AuthGate Documentation</h1>
          <p className="text-muted-foreground text-sm">Developer API and Integration Guides</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-md hover:bg-primary/90 transition-colors">
            Login to Dashboard
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Left Sidebar */}
        <div className="md:col-span-1 space-y-2">
          {[
            { id: "intro", title: "Introduction", icon: BookOpen },
            { id: "setup", title: "Getting Started", icon: Terminal },
            { id: "credentials", title: "Credentials Login", icon: ShieldCheck },
            { id: "orgs", title: "Organizations & RBAC", icon: Building2 },
            { id: "oauth", title: "OAuth 2.1 Apps & PKCE", icon: Key },
            { id: "2fa", title: "Multi-Factor Auth (2FA)", icon: Shield },
            { id: "otp", title: "Decoupled OTP Mediator", icon: Cpu },
            { id: "social", title: "Social Logins", icon: Laptop },
            { id: "oidc", title: "OIDC & Enterprise SSO", icon: KeyRound },
          ].map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setDocSection(section.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-sm font-semibold border transition-all ${
                  docSection === section.id
                    ? "bg-primary/10 border-primary/20 text-primary shadow-sm"
                    : "bg-card/50 border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{section.title}</span>
              </button>
            );
          })}
        </div>

        {/* Right Main Panel */}
        <div className="md:col-span-3 space-y-6">
          <Card className="border-border">
            <CardContent className="pt-6 space-y-6">
              {docSection === "intro" && <IntroDoc />}
              {docSection === "setup" && <SetupDoc />}
              {docSection === "credentials" && <CredentialsDoc />}
              {docSection === "orgs" && <OrgDoc />}
              {docSection === "oauth" && <OAuthClientDoc />}
              {docSection === "2fa" && <TwoFactorDoc />}
              {docSection === "otp" && <OtpDoc />}
              {docSection === "social" && <SocialDoc />}
              {docSection === "oidc" && <OidcDoc />}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
