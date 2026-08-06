import { useState, useEffect } from "react";
import { 
  KeyRound, 
  UserPlus, 
  MailCheck, 
  LogOut, 
  User, 
  ShieldCheck, 
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  Unlock
} from "lucide-react";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./components/ui/card";

const API_URL = "http://localhost:3000";

type View = "login" | "register" | "verify" | "forgot" | "reset" | "dashboard";

interface UserProfile {
  id: string;
  email: string;
  isEmailVerified: boolean;
  createdAt: string;
}

export default function App() {
  const [view, setView] = useState<View>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [token, setToken] = useState("");
  
  // States to hold token outputs shown during development/demo:
  const [verificationTokenInfo, setVerificationTokenInfo] = useState<string | null>(null);
  const [resetTokenInfo, setResetTokenInfo] = useState<string | null>(null);
  
  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Check if session exists on boot
  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.data.user);
        setView("dashboard");
      }
    } catch (e) {
      console.log("No active session detected.");
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    setVerificationTokenInfo(null);

    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error.message);
      } else {
        setInfo("Registration successful! Verify your email to login.");
        setVerificationTokenInfo(data.data.verificationToken);
        setToken(data.data.verificationToken); // Pre-fill token
        setView("verify");
      }
    } catch (e: any) {
      setError("Failed to connect to auth server.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error.message);
      } else {
        setUser(data.data.user);
        setView("dashboard");
      }
    } catch (e: any) {
      setError("Failed to connect to auth server.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      const res = await fetch(`${API_URL}/api/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error.message);
      } else {
        setInfo("Email verified successfully! You can now log in.");
        setVerificationTokenInfo(null);
        setView("login");
      }
    } catch (e: any) {
      setError("Failed to verify email.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    setResetTokenInfo(null);

    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error.message);
      } else {
        if (data.data.resetToken) {
          setInfo("Password reset token generated (simulating email dispatch).");
          setResetTokenInfo(data.data.resetToken);
          setToken(data.data.resetToken); // Pre-fill token
          setView("reset");
        } else {
          setInfo("If the email exists, a password reset link has been dispatched.");
        }
      }
    } catch (e: any) {
      setError("Failed to submit request.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error.message);
      } else {
        setInfo("Password reset successfully. You can now log in.");
        setResetTokenInfo(null);
        setView("login");
      }
    } catch (e: any) {
      setError("Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      setUser(null);
      setView("login");
      setInfo("Logged out successfully.");
    } catch (e: any) {
      setError("Logout failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-950 px-4 py-12">
      {/* Decorative blurred backgrounds */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-purple-500/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Title/Header logo */}
        <div className="flex items-center justify-center gap-2 mb-8 select-none">
          <ShieldCheck className="w-9 h-9 text-purple-500" />
          <h1 className="text-3xl font-bold tracking-tight text-white">Auth<span className="text-purple-500">Gate</span></h1>
        </div>

        {/* Global Notifications */}
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

        {/* Dynamic Screens */}
        {view === "login" && (
          <Card>
            <form onSubmit={handleLogin}>
              <CardHeader>
                <CardTitle>Welcome back</CardTitle>
                <CardDescription>Enter your account credentials to log in</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email Address</Label>
                  <Input 
                    id="login-email" 
                    type="email" 
                    placeholder="name@example.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="login-password">Password</Label>
                    <button 
                      type="button" 
                      onClick={() => setView("forgot")}
                      className="text-xs text-purple-400 hover:text-purple-300 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Input 
                      id="login-password" 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <KeyRound className="w-4 h-4 mr-2" />}
                  Sign In
                </Button>
                <p className="text-center text-xs text-slate-400">
                  Don't have an account?{" "}
                  <button 
                    type="button" 
                    onClick={() => setView("register")}
                    className="text-purple-400 hover:text-purple-300 font-medium hover:underline"
                  >
                    Register here
                  </button>
                </p>
              </CardFooter>
            </form>
          </Card>
        )}

        {view === "register" && (
          <Card>
            <form onSubmit={handleRegister}>
              <CardHeader>
                <CardTitle>Create Account</CardTitle>
                <CardDescription>Register a new identity user on the platform</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email Address</Label>
                  <Input 
                    id="register-email" 
                    type="email" 
                    placeholder="name@example.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Password</Label>
                  <div className="relative">
                    <Input 
                      id="register-password" 
                      type={showPassword ? "text" : "password"} 
                      placeholder="At least 8 characters" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
                  Register User
                </Button>
                <p className="text-center text-xs text-slate-400">
                  Already have an account?{" "}
                  <button 
                    type="button" 
                    onClick={() => setView("login")}
                    className="text-purple-400 hover:text-purple-300 font-medium hover:underline"
                  >
                    Log in
                  </button>
                </p>
              </CardFooter>
            </form>
          </Card>
        )}

        {view === "verify" && (
          <Card>
            <form onSubmit={handleVerify}>
              <CardHeader>
                <CardTitle>Verify Your Email</CardTitle>
                <CardDescription>Enter the token received to complete verification</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {verificationTokenInfo && (
                  <div className="p-3 bg-purple-950/20 border border-purple-800/40 rounded-lg text-xs space-y-1 text-slate-300">
                    <p className="font-semibold text-purple-400">Development Mode Token:</p>
                    <code className="block select-all break-all bg-slate-900/60 p-2 rounded border border-slate-800 text-purple-300">{verificationTokenInfo}</code>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="verification-token">Verification Token</Label>
                  <Input 
                    id="verification-token" 
                    type="text" 
                    placeholder="Enter verification code" 
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <MailCheck className="w-4 h-4 mr-2" />}
                  Verify Account
                </Button>
                <Button type="button" variant="outline" className="w-full" onClick={() => setView("login")}>
                  Back to Login
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}

        {view === "forgot" && (
          <Card>
            <form onSubmit={handleForgotPassword}>
              <CardHeader>
                <CardTitle>Reset Password</CardTitle>
                <CardDescription>Request a secure password recovery flow</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email">Account Email Address</Label>
                  <Input 
                    id="forgot-email" 
                    type="email" 
                    placeholder="name@example.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Unlock className="w-4 h-4 mr-2" />}
                  Generate Reset Token
                </Button>
                <Button type="button" variant="outline" className="w-full" onClick={() => setView("login")}>
                  Cancel
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}

        {view === "reset" && (
          <Card>
            <form onSubmit={handleResetPassword}>
              <CardHeader>
                <CardTitle>Update Password</CardTitle>
                <CardDescription>Enter the recovery token and pick a new password</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {resetTokenInfo && (
                  <div className="p-3 bg-purple-950/20 border border-purple-800/40 rounded-lg text-xs space-y-1 text-slate-300">
                    <p className="font-semibold text-purple-400">Development Mode Reset Token:</p>
                    <code className="block select-all break-all bg-slate-900/60 p-2 rounded border border-slate-800 text-purple-300">{resetTokenInfo}</code>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="reset-token">Recovery Token</Label>
                  <Input 
                    id="reset-token" 
                    type="text" 
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reset-password">New Password</Label>
                  <Input 
                    id="reset-password" 
                    type="password" 
                    placeholder="At least 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button type="submit" className="w-full" disabled={loading}>
                  Reset Password
                </Button>
                <Button type="button" variant="outline" className="w-full" onClick={() => setView("login")}>
                  Cancel
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}

        {view === "dashboard" && user && (
          <Card className="border-purple-500/30">
            <CardHeader className="border-b border-border/60 pb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-xl">User Console</CardTitle>
                  <CardDescription className="text-purple-400">Status: Authenticated</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-xs text-slate-400 block font-medium uppercase tracking-wider">User ID</span>
                  <code className="text-xs text-slate-200 block bg-slate-900/60 p-2.5 rounded border border-slate-800 select-all font-mono">{user.id}</code>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-slate-400 block font-medium uppercase tracking-wider">Email</span>
                    <span className="text-sm font-semibold text-white block mt-1 truncate">{user.email}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-medium uppercase tracking-wider">Verification status</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold mt-1.5 ${
                      user.isEmailVerified 
                        ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20" 
                        : "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                    }`}>
                      {user.isEmailVerified ? "Verified" : "Pending Verification"}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-medium uppercase tracking-wider">Joined At</span>
                  <span className="text-sm text-slate-200 block mt-1">{new Date(user.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t border-border/60 pt-6">
              <Button variant="outline" className="w-full border-red-900/40 text-red-400 hover:bg-red-950/20 hover:text-red-300" onClick={handleLogout} disabled={loading}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}
