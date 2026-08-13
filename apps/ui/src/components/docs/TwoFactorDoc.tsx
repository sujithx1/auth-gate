import { CodeBlock } from "./CodeBlock";

export function TwoFactorDoc() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Multi-Factor Authentication (2FA)</h2>
        <p className="text-sm text-muted-foreground">
          A secondary layer of security that requires users to provide an additional time-based one-time password (TOTP) from an authenticator app.
        </p>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">When is this helpful?</h3>
        <p className="text-sm text-muted-foreground">
          Essential for applications handling sensitive user data, financial transactions, or enterprise environments where compliance and high security are mandatory.
        </p>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Solving the problem</h3>
        <p className="text-sm text-muted-foreground">
          Generating secure TOTP secrets, validating rolling time-based codes, generating backup recovery keys, and enforcing 2FA challenges during the login flow is notoriously difficult to implement securely.
        </p>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">How this SDK does it</h3>
        <p className="text-sm text-muted-foreground">
          AuthGate automatically generates the TOTP secret and a scannable URI for Google Authenticator. It also seamlessly issues cryptographically secure backup codes and handles the verification logic in just a few lines of code.
        </p>
      </div>

      <CodeBlock code={`// 1. Request authenticator registration
const { secret, uri } = await auth.enableTwoFactor();

// 2. Validate first generated passcode to confirm and activate 2FA
const { backupCodes } = await auth.verifyTwoFactor("123456");
console.log("Save backup keys securely:", backupCodes);

// 3. Disable 2FA
await auth.disableTwoFactor("123456");`} />
    </div>
  );
}
