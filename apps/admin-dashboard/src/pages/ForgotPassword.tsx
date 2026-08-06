import React, { useState } from "react";
import { Unlock, RefreshCw } from "lucide-react";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../components/ui/card";

interface ForgotPasswordProps {
  onSuccess: (resetToken: string | null, message: string) => void;
  onNavigate: (view: "login") => void;
  onError: (msg: string) => void;
}

export default function ForgotPassword({ onSuccess, onNavigate, onError }: ForgotPasswordProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data: any = await api.post("/api/auth/forgot-password", { email });
      if (data.data.resetToken) {
        onSuccess(data.data.resetToken, "Password reset token generated (simulating email dispatch).");
      } else {
        onSuccess(null, "If the email exists, a password reset link has been dispatched.");
      }
    } catch (e: any) {
      onError(e.error?.message || "Failed to submit request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit}>
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
          <Button type="button" variant="outline" className="w-full" onClick={() => onNavigate("login")}>
            Cancel
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
