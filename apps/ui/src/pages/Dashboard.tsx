import { useState, useEffect } from "react";
import { User as UserIcon, LogOut, Building2, Laptop, ShieldCheck, Mail, Calendar, UserCheck, Shield, RefreshCw, QrCode, BookOpen, Terminal, Cpu } from "lucide-react";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { IntroDoc } from "../components/docs/IntroDoc";
import { SetupDoc } from "../components/docs/SetupDoc";
import { CredentialsDoc } from "../components/docs/CredentialsDoc";
import { TwoFactorDoc } from "../components/docs/TwoFactorDoc";
import { OtpDoc } from "../components/docs/OtpDoc";
import { SocialDoc } from "../components/docs/SocialDoc";

interface DashboardProps {
  user: {
    id: string;
    email: string;
    isEmailVerified: boolean;
    createdAt: string;
    is2faActive?: boolean;
  };
  onLogout: () => void;
  onNavigateOrgs: () => void;
  onNavigateClients: () => void;
  onError: (msg: string) => void;
}

export default function Dashboard({ user, onLogout, onNavigateOrgs, onNavigateClients, onError }: DashboardProps) {
  const [loading, setLoading] = useState(false);
  const [is2faActive, setIs2faActive] = useState(user.is2faActive || false);
  const [mfaSecret, setMfaSecret] = useState<string | null>(null);
  const [mfaUri, setMfaUri] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"dashboard" | "docs">("dashboard");
  const [docSection, setDocSection] = useState<string>("intro");

  const fetchSessions = async () => {
    try {
      const res: any = await api.get("/api/auth/sessions");
      setSessions(res.data || []);
    } catch {
      // Silently ignore failures
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevokeSession = async (id: string) => {
    setLoading(true);
    try {
      await api.delete(`/api/auth/sessions/${id}`);
      fetchSessions();
    } catch (e: any) {
      onError(e.error?.message || "Failed to revoke session.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/api/auth/logout");
      onLogout();
    } catch (e: any) {
      onError("Logout failed.");
    }
  };

  const handleEnable2FA = async () => {
    setLoading(true);
    try {
      const res: any = await api.post("/api/auth/2fa/enable");
      setMfaSecret(res.secret);
      setMfaUri(res.uri);
    } catch (e: any) {
      onError(e.error?.message || "Failed to initialize 2FA.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!code) return;
    setLoading(true);
    try {
      const res: any = await api.post("/api/auth/2fa/verify", { code });
      setBackupCodes(res.backupCodes);
      setIs2faActive(true);
      setMfaSecret(null);
      setMfaUri(null);
      setCode("");
    } catch (e: any) {
      onError(e.error?.message || "Failed to verify 2FA code.");
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!code) return;
    setLoading(true);
    try {
      await api.post("/api/auth/2fa/disable", { code });
      setIs2faActive(false);
      setBackupCodes([]);
      setCode("");
    } catch (e: any) {
      onError(e.error?.message || "Failed to disable 2FA.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 px-4 py-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Developer Portal</h1>
            <p className="text-muted-foreground text-sm">Welcome back, {user.email}</p>
          </div>
          <div className="flex items-center gap-2 bg-secondary/50 p-1 rounded-lg border border-border mt-2 md:mt-0">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === "dashboard"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab("docs")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === "docs"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Developer API Docs
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleLogout} className="border-border">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      {activeTab === "docs" ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Left Sidebar */}
          <div className="md:col-span-1 space-y-2">
            {[
              { id: "intro", title: "Introduction", icon: BookOpen },
              { id: "setup", title: "Getting Started", icon: Terminal },
              { id: "credentials", title: "Credentials Login", icon: ShieldCheck },
              { id: "2fa", title: "Multi-Factor Auth (2FA)", icon: Shield },
              { id: "otp", title: "Decoupled OTP Mediator", icon: Cpu },
              { id: "social", title: "Social Logins", icon: Laptop },
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
                {docSection === "2fa" && <TwoFactorDoc />}
                {docSection === "otp" && <OtpDoc />}
                {docSection === "social" && <SocialDoc />}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <>
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
            <div className="md:col-span-1 space-y-6">
              {/* Profile Card details */}
              <Card className="border-border">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-primary" />
                    <CardTitle className="text-lg">Identity Details</CardTitle>
                  </div>
                  <CardDescription>Personal verification status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>

              {/* MFA Settings Card */}
              <Card className="border-border">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    <CardTitle className="text-lg">Two-Factor Auth</CardTitle>
                  </div>
                  <CardDescription>Secure authenticator configurations</CardDescription>
                </CardHeader>
                <CardContent>
                  {is2faActive ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 p-3 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-lg text-xs font-semibold">
                        <ShieldCheck className="w-4 h-4" />
                        TOTP Two-Factor is Active
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="disable-2fa-code">Enter Code to Disable</Label>
                        <Input
                          id="disable-2fa-code"
                          type="text"
                          maxLength={6}
                          placeholder="123456"
                          value={code}
                          onChange={(e) => setCode(e.target.value)}
                        />
                        <Button
                          onClick={handleDisable2FA}
                          variant="destructive"
                          className="w-full text-xs"
                          disabled={loading || !code}
                        >
                          {loading && <RefreshCw className="w-4 h-4 animate-spin mr-2" />}
                          Disable 2FA
                        </Button>
                      </div>
                    </div>
                  ) : mfaSecret ? (
                    <div className="space-y-4">
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Scan the QR code below or copy the manual key to your authenticator app (Google Authenticator, Duo, etc.).
                      </p>
                      {mfaUri && (
                        <div className="flex justify-center p-3 bg-white rounded-lg border border-border w-[170px] mx-auto">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                              mfaUri
                            )}`}
                            alt="MFA QR Code"
                            className="w-[150px] h-[150px]"
                          />
                        </div>
                      )}
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">Manual Setup Key</Label>
                        <pre className="p-2 bg-muted rounded border border-border text-xs break-all select-all font-mono">
                          {mfaSecret}
                        </pre>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="verify-2fa-code">Verification Code</Label>
                        <Input
                          id="verify-2fa-code"
                          type="text"
                          maxLength={6}
                          placeholder="123456"
                          value={code}
                          onChange={(e) => setCode(e.target.value)}
                        />
                        <Button
                          onClick={handleVerify2FA}
                          className="w-full text-xs"
                          disabled={loading || !code}
                        >
                          {loading && <RefreshCw className="w-4 h-4 animate-spin mr-2" />}
                          Verify & Activate 2FA
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Protect your developer account by requiring a temporary 6-digit verification code from your authenticator application at login.
                      </p>
                      <Button onClick={handleEnable2FA} className="w-full" disabled={loading}>
                        {loading && <RefreshCw className="w-4 h-4 animate-spin mr-2" />}
                        <QrCode className="w-4 h-4 mr-2" />
                        Setup Authenticator 2FA
                      </Button>
                    </div>
                  )}

                  {/* Render recovery keys */}
                  {backupCodes && backupCodes.length > 0 && (
                    <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border space-y-3">
                      <h4 className="text-xs font-bold text-foreground">Backup Recovery Codes</h4>
                      <p className="text-[10px] text-muted-foreground leading-normal">
                        Store these recovery codes securely. Each code can be used exactly once if you lose access to your device.
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono text-center">
                        {backupCodes.map((c, i) => (
                          <div key={i} className="p-1 bg-background border border-border rounded text-[11px] select-all">
                            {c}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="md:col-span-2 space-y-6">
              {/* Quick Setup Guide */}
              <Card className="border-border">
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

              {/* Active Sessions Card */}
              <Card className="border-border">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-primary" />
                    <CardTitle className="text-lg">Logged-in Sessions</CardTitle>
                  </div>
                  <CardDescription>Revoke access tokens and sign out of other active browsers</CardDescription>
                </CardHeader>
                <CardContent>
                  {sessions.length === 0 ? (
                    <div className="text-xs text-muted-foreground">No active sessions found.</div>
                  ) : (
                    <div className="space-y-4">
                      {sessions.map((s) => (
                        <div key={s.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-card/50 rounded-lg border border-border gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-foreground break-all">{s.userAgent}</span>
                              {s.isCurrent && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                                  This Device
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground flex gap-3">
                              <span>IP: {s.ipAddress}</span>
                              <span>•</span>
                              <span>Expires: {new Date(s.expiresAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          {!s.isCurrent && (
                            <Button
                              onClick={() => handleRevokeSession(s.id)}
                              variant="outline"
                              size="sm"
                              className="border-destructive/20 text-destructive hover:bg-destructive/10"
                            >
                              Revoke Access
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
