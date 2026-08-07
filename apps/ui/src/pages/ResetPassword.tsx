import React, { useState } from "react";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../components/ui/card";

interface ResetPasswordProps {
  initialToken?: string;
  onSuccess: (message: string) => void;
  onNavigate: (view: "login") => void;
  onError: (msg: string) => void;
}

export default function ResetPassword({ initialToken = "", onSuccess, onNavigate, onError }: ResetPasswordProps) {
  const [token, setToken] = useState(initialToken);
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post("/api/auth/reset-password", { token, newPassword });
      onSuccess("Password reset successfully. You can now log in.");
    } catch (e: any) {
      onError(e.error?.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Update Password</CardTitle>
          <CardDescription>Enter the recovery token and pick a new password</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {initialToken && (
            <div className="p-3 bg-secondary/50 border border-border rounded-lg text-xs space-y-1 text-muted-foreground">
              <p className="font-semibold text-primary">Development Mode Reset Token:</p>
              <code className="block select-all break-all bg-muted p-2 rounded border border-border text-foreground">
                {initialToken}
              </code>
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
          <Button type="button" variant="outline" className="w-full" onClick={() => onNavigate("login")}>
            Cancel
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
