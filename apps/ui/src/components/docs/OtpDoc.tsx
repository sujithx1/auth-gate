import { CodeBlock } from "./CodeBlock";

export function OtpDoc() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Decoupled OTP Mediator</h2>
        <p className="text-sm text-muted-foreground">
          A headless one-time password generator that decouples code creation and verification from the actual delivery mechanism.
        </p>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">When is this helpful?</h3>
        <p className="text-sm text-muted-foreground">
          Perfect for passwordless login flows via Email or SMS (magic codes), or when you want to use your own specific delivery providers like Twilio, Resend, or Amazon SES.
        </p>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Solving the problem</h3>
        <p className="text-sm text-muted-foreground">
          Most auth providers force you to use their built-in email delivery systems or write complex webhooks to intercept codes. Managing OTP state, expiration, and brute-force rate limits manually requires a dedicated database table and background jobs.
        </p>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">How this SDK does it</h3>
        <p className="text-sm text-muted-foreground">
          AuthGate handles the entire state lifecycle: it securely generates the code, stores the hash, enforces the expiration TTL, and validates it. It simply returns the raw text code to your backend so you can send it however you want.
        </p>
      </div>

      <CodeBlock code={`// 1. Generate code (returns plain text OTP code to your server)
const { code } = await auth.generateOtp({
  identifier: "user@example.com",
  length: 6,
  expiresSeconds: 300
});

// Deliver the 'code' variable using Twilio, SMTP, or SendGrid here...

// 2. Verify incoming user code to establish session
const session = await auth.verifyOtp({
  identifier: "user@example.com",
  code: "128372"
});`} />
    </div>
  );
}
