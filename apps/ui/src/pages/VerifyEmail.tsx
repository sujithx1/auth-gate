import React, { useState } from "react";
import { MailCheck, RefreshCw } from "lucide-react";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../components/ui/card";

interface VerifyEmailProps {
  initialToken?: string;
  onSuccess: (message: string) => void;
  onNavigate: (view: "login") => void;
  onError: (msg: string) => void;
}

export default function VerifyEmail({ initialToken = "", onSuccess, onNavigate, onError }: VerifyEmailProps) {
  const [token, setToken] = useState(initialToken);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token.trim()) {
      onError("Please enter your verification token.");
      return;
    }

    setLoading(true);

    try {
      await api.post("/api/auth/verify-email", { token: token.trim() });
      onSuccess("Email verified successfully! You can now log in.");
    } catch (e: any) {
      onError(e.error?.message || "Failed to verify email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <form noValidate onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Verify Your Email</CardTitle>
          <CardDescription>Enter the token received to complete verification</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {initialToken && (
            <div className="p-3 bg-secondary/50 border border-border rounded-lg text-xs space-y-1 text-muted-foreground">
              <p className="font-semibold text-primary">Development Mode Token:</p>
              <code className="block select-all break-all bg-muted p-2 rounded border border-border text-foreground">
                {initialToken}
              </code>
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
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <MailCheck className="w-4 h-4 mr-2" />}
            Verify Account
          </Button>
          <Button type="button" variant="outline" className="w-full" onClick={() => onNavigate("login")}>
            Back to Login
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
