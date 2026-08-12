export function SocialDoc() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Social Sign-In Redirections</h2>
      <p className="text-sm text-muted-foreground">
        Initiate federated auth by redirecting the browser window directly to the AuthGate provider endpoints:
      </p>
      <pre className="p-4 bg-muted rounded-lg border border-border text-xs overflow-x-auto text-foreground font-mono">
{`// Redirect browser to trigger social consent redirects
window.location.href = "http://localhost:3005/api/auth/social/google";
window.location.href = "http://localhost:3005/api/auth/social/github";`}
      </pre>
    </div>
  );
}
