export function OtpDoc() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Decoupled OTP Mediator</h2>
      <p className="text-sm text-muted-foreground">
        Generate random numeric OTP codes on AuthGate and deliver them using your own carrier:
      </p>
      <pre className="p-4 bg-muted rounded-lg border border-border text-xs overflow-x-auto text-foreground font-mono">
{`// 1. Generate code (returns plain text OTP code to your server)
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
});`}
      </pre>
    </div>
  );
}
