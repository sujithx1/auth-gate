export function IntroDoc() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Introduction to AuthGate</h2>
      <p className="text-sm text-muted-foreground leading-relaxed">
        AuthGate is a high-performance, developer-centric authentication engine designed to act as a secure mediator between client applications and backend user records. It implements strict type safety, PKCE-guarded OAuth 2.1 authentication protocol, multi-tenant organizations, and decoupled transport factors.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <div className="p-4 bg-muted/50 rounded-lg border border-border space-y-2">
          <h4 className="font-semibold text-sm">Decoupled Mediator Model</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            AuthGate generates and hashes codes, leaving transport carriers (Twilio, SendGrid, push alerts) to the choice of the developer.
          </p>
        </div>
        <div className="p-4 bg-muted/50 rounded-lg border border-border space-y-2">
          <h4 className="font-semibold text-sm">Strict Security Gates</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Equipped with local RFC 6238 TOTP engine, secure password hashing, and active device revocation options.
          </p>
        </div>
      </div>
    </div>
  );
}
