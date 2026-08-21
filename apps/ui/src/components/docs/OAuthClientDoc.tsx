export function OAuthClientDoc() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">OAuth 2.1 & PKCE Authorization Server</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Register third-party client applications and authorize users securely using PKCE (Proof Key for Code Exchange).
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-base font-semibold">1. Register Client Application</h3>
        <p className="text-xs text-muted-foreground">
          Register a new OAuth 2.1 client app in the Developer Console:
        </p>
        <div className="p-3 bg-muted rounded-lg border border-border">
          <code className="text-xs font-mono select-all text-primary block whitespace-pre">
{`POST /api/oauth/clients
Body: {
  "name": "My Client App",
  "redirectUris": ["http://localhost:5173/callback"]
}`}
          </code>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-base font-semibold">2. Initiate PKCE Authorization Request</h3>
        <p className="text-xs text-muted-foreground">
          Redirect users to the consent page with a SHA-256 code challenge:
        </p>
        <div className="p-3 bg-muted rounded-lg border border-border">
          <code className="text-xs font-mono select-all text-primary block whitespace-pre">
{`GET /api/oauth/authorize?response_type=code&client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_CALLBACK_URL&code_challenge=HASHED_CHALLENGE&code_challenge_method=S256`}
          </code>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-base font-semibold">3. Exchange Code for Tokens</h3>
        <p className="text-xs text-muted-foreground">
          Exchange authorization code and PKCE code verifier for Access & Refresh tokens:
        </p>
        <div className="p-3 bg-muted rounded-lg border border-border">
          <code className="text-xs font-mono select-all text-primary block whitespace-pre">
{`POST /api/oauth/token
Body (or application/x-www-form-urlencoded): {
  "grant_type": "authorization_code",
  "client_id": "YOUR_CLIENT_ID",
  "code": "AUTHORIZATION_CODE",
  "code_verifier": "RAW_CODE_VERIFIER"
}`}
          </code>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-base font-semibold">4. Refresh Access Token</h3>
        <p className="text-xs text-muted-foreground">
          Obtain new access tokens using a refresh token:
        </p>
        <div className="p-3 bg-muted rounded-lg border border-border">
          <code className="text-xs font-mono select-all text-primary block whitespace-pre">
{`POST /api/oauth/token
Body: {
  "grant_type": "refresh_token",
  "client_id": "YOUR_CLIENT_ID",
  "refresh_token": "REFRESH_TOKEN"
}`}
          </code>
        </div>
      </div>
    </div>
  );
}
