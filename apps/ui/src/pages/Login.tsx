import React, { useState } from "react";
import { KeyRound, Eye, EyeOff, RefreshCw } from "lucide-react";
import { api } from "../lib/api";
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
    setLoading(true);

    try {
      if (twoFactorRequired) {
        // Step 2: verify 2FA code
        const data: any = await api.post("/api/auth/login/verify-2fa", {
          userId: tempUserId,
          code: twoFactorCode,
        });
        onSuccess(data.data.user);
      } else {
        // Step 1: verify email & password
        const data: any = await api.post("/api/auth/login", { email, password });
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
        <form onSubmit={handleSubmit}>
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
                required
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
      <form onSubmit={handleSubmit}>
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
                required
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
