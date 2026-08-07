import { User as UserIcon, LogOut, Building2, Laptop, ShieldCheck, Mail, Calendar, Key, UserCheck } from "lucide-react";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../components/ui/card";

interface DashboardProps {
  user: {
    id: string;
    email: string;
    isEmailVerified: boolean;
    createdAt: string;
  };
  onLogout: () => void;
  onNavigateOrgs: () => void;
  onNavigateClients: () => void;
  onError: (msg: string) => void;
}

export default function Dashboard({ user, onLogout, onNavigateOrgs, onNavigateClients, onError }: DashboardProps) {
  const handleLogout = async () => {
    try {
      await api.post("/api/auth/logout");
      onLogout();
    } catch (e: any) {
      onError("Logout failed.");
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 px-4 py-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Developer Portal</h1>
          <p className="text-muted-foreground text-sm">Welcome back, {user.email}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleLogout} className="border-border">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="bg-card/50 border-border">
          <CardContent className="pt-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block">Verify Status</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                user.isEmailVerified
                  ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
              }`}>
                {user.isEmailVerified ? "Verified Account" : "Pending Verification"}
              </span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <UserCheck className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border cursor-pointer hover:border-primary/50 transition-colors" onClick={onNavigateOrgs}>
          <CardContent className="pt-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block">Organizations</span>
              <span className="text-lg font-bold">Manage Workspaces</span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Building2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border cursor-pointer hover:border-primary/50 transition-colors" onClick={onNavigateClients}>
          <CardContent className="pt-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block">Developer Clients</span>
              <span className="text-lg font-bold">Register OAuth Apps</span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Laptop className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Card details */}
        <Card className="md:col-span-1 border-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-primary" />
              <CardTitle className="text-lg">Identity Details</CardTitle>
            </div>
            <CardDescription>Your account developer profile</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground block font-medium">Developer ID</span>
              <code className="text-xs block bg-muted p-2 rounded border border-border select-all font-mono break-all">
                {user.id}
              </code>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground block font-medium">Email Address</span>
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span>{user.email}</span>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground block font-medium">Joined On</span>
              <div className="flex items-center gap-2 text-sm text-foreground">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>{new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Setup Guide */}
        <Card className="md:col-span-2 border-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Active Integration Guides</CardTitle>
            </div>
            <CardDescription>Integrate AuthGate in your local server app</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  1
                </div>
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm">Configure Client Adapter</h4>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    Set up your backend connection with your database adapter. We support Drizzle adapters natively out of the box.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  2
                </div>
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm">Define Roles and Custom Permissions</h4>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    Head to Organizations tab to invite team members and set roles (`ADMIN`, `MEMBER`). Set up route middleware authorization checks.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  3
                </div>
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm">Register Client Credentials</h4>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    Create client credentials under Developer Clients to support PKCE-guarded authorization exchanges.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
