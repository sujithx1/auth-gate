import React, { useState } from "react";
import { UserPlus, Eye, EyeOff, RefreshCw } from "lucide-react";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../components/ui/card";

interface RegisterProps {
  onSuccess: (token: string, message: string) => void;
  onNavigate: (view: "login") => void;
  onError: (msg: string) => void;
}

export default function Register({ onSuccess, onNavigate, onError }: RegisterProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
      onError("Please enter a password.");
      return;
    }
    if (password.length < 8) {
      onError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);

    try {
      const data: any = await api.post("/api/auth/register", { email: email.trim(), password });
      onSuccess(data.data.verificationToken, "Registration successful! Verify your email to login.");
    } catch (e: any) {
      onError(e.error?.message || "Failed to register.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <form noValidate onSubmit={handleSubmit}>
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
            {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
            Register User
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => onNavigate("login")}
              className="text-primary hover:underline font-semibold"
            >
              Log in
            </button>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
