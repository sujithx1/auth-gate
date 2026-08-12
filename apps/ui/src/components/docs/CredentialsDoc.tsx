export function CredentialsDoc() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Email & Password Login</h2>
      <p className="text-sm text-muted-foreground">
        Verify email and password credentials. If the user has 2FA active, handle the `TWO_FACTOR_REQUIRED` callback:
      </p>
      <pre className="p-4 bg-muted rounded-lg border border-border text-xs overflow-x-auto text-foreground font-mono">
{`try {
  const session = await auth.login("user@example.com", "secure-password");
  console.log("Logged in user:", session.data.user.email);
} catch (error) {
  if (error.code === "TWO_FACTOR_REQUIRED") {
    // Redirect to your custom OTP/2FA passcode entry screen
    console.log("Passcode required for User ID:", error.details.userId);
  }
}`}
      </pre>
    </div>
  );
}
