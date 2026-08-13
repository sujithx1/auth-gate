import { CodeBlock } from "./CodeBlock";

export function CredentialsDoc() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Email & Password Login</h2>
        <p className="text-sm text-muted-foreground">
          The core traditional authentication method allowing users to sign in using their registered email and a secure password.
        </p>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">When is this helpful?</h3>
        <p className="text-sm text-muted-foreground">
          This is the standard, universally understood login flow. It is essential for most traditional web applications where users prefer not to link third-party social accounts or when you require strict isolation of user identity.
        </p>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Solving the problem</h3>
        <p className="text-sm text-muted-foreground">
          Managing secure password hashing, salt generation, session creation, and handling multi-factor authentication interruptions can be complex and error-prone when built from scratch.
        </p>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">How this SDK does it</h3>
        <p className="text-sm text-muted-foreground">
          The SDK provides a single \`login\` method that securely transmits credentials, handles the backend session handshake, and seamlessly intercepts 2FA requirements by throwing a typed error you can catch to redirect the user.
        </p>
      </div>

      <CodeBlock code={`try {
  const session = await auth.login("user@example.com", "secure-password");
  console.log("Logged in user:", session.data.user.email);
} catch (error) {
  if (error.code === "TWO_FACTOR_REQUIRED") {
    // Redirect to your custom OTP/2FA passcode entry screen
    console.log("Passcode required for User ID:", error.details.userId);
  }
}`} />
    </div>
  );
}
