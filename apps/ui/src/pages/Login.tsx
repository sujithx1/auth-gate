import React, { useState } from "react";
import { KeyRound, Eye, EyeOff, RefreshCw } from "lucide-react";
import { api } from "../lib/api";
import { env } from "../env";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../components/ui/card";

interface LoginProps {
  onSuccess: (user: any) => void;
  onNavigate: (view: "register" | "forgot") => void;
  onError: (msg: string) => void;
}

export default function Login({ onSuccess, onNavigate, onError }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // 2FA state
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [tempUserId, setTempUserId] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (twoFactorRequired) {
      if (!twoFactorCode.trim()) {
        onError("Please enter your verification code.");
        return;
      }
    } else {
      if (!email.trim()) {
        onError("Please enter your email address.");
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        onError("Please enter a valid email address.");
        return;
      }
      if (!password) {
        onError("Please enter your password.");
        return;
      }
    }

    setLoading(true);

    try {
      if (twoFactorRequired) {
        // Step 2: verify 2FA code
        const data: any = await api.post("/api/auth/login/verify-2fa", {
          userId: tempUserId,
          code: twoFactorCode.trim(),
        });
        onSuccess(data.data.user);
      } else {
        // Step 1: verify email & password
        const data: any = await api.post("/api/auth/login", { email: email.trim(), password });
        if (data.twoFactorRequired) {
          setTwoFactorRequired(true);
          setTempUserId(data.userId);
        } else {
          onSuccess(data.data.user);
        }
      }
    } catch (e: any) {
      onError(e.error?.message || "Failed to log in.");
    } finally {
      setLoading(false);
    }
  };

  if (twoFactorRequired) {
    return (
      <Card>
        <form noValidate onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Two-Factor Verification</CardTitle>
            <CardDescription>Enter the 6-digit authenticator passcode or a backup recovery code.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-2fa-code">Verification Code</Label>
              <Input
                id="login-2fa-code"
                type="text"
                maxLength={8}
                placeholder="123456"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <KeyRound className="w-4 h-4 mr-2" />}
              Verify Code
            </Button>
            <button
              type="button"
              onClick={() => {
                setTwoFactorRequired(false);
                setTwoFactorCode("");
              }}
              className="text-xs text-muted-foreground hover:text-foreground hover:underline"
            >
              Back to Login
            </button>
          </CardFooter>
        </form>
      </Card>
    );
  }

  return (
    <Card>
      <form noValidate onSubmit={handleSubmit}>
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
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="login-password">Password</Label>
              <button
                type="button"
                onClick={() => onNavigate("forgot")}
                className="text-xs text-muted-foreground hover:text-foreground hover:underline"
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
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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

          <div className="relative w-full flex items-center justify-center my-2">
            <hr className="w-full border-border" />
            <span className="absolute px-3 bg-card text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
              Or continue with
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={() => { window.location.href = `${env.VITE_API_URL}/api/auth/social/google`; }}
              className="w-full border-border hover:bg-muted"
            >
              <svg className="w-4 h-4 mr-2 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              Google
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => { window.location.href = `${env.VITE_API_URL}/api/auth/social/github`; }}
              className="w-full border-border hover:bg-muted"
            >
              <svg className="w-4 h-4 mr-2 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
              </svg>
              GitHub
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={() => onNavigate("register")}
              className="text-primary hover:underline font-semibold"
            >
              Register here
            </button>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
