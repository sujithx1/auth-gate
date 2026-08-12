import { CodeBlock } from "./CodeBlock";

export function TwoFactorDoc() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Multi-Factor Authentication (2FA)</h2>
      <p className="text-sm text-muted-foreground">
        Let users manage Google Authenticator secrets and copy backup recovery keys:
      </p>
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
