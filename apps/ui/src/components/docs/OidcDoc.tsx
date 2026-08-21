export function OidcDoc() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">Stage 5: OIDC Discovery & Enterprise SAML 2.0</h2>
        <p className="text-sm text-muted-foreground mt-1">
          AuthGate functions as a standard OpenID Connect Identity Provider (IdP) and Enterprise SAML 2.0 Service Provider (SP).
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-base font-semibold">1. OpenID Connect Discovery</h3>
        <p className="text-xs text-muted-foreground">
          Standard OIDC client SDKs and applications automatically discover endpoints via the standard metadata URL:
        </p>
        <div className="p-3 bg-muted rounded-lg border border-border">
          <code className="text-xs font-mono select-all text-primary block">
            GET /.well-known/openid-configuration
          </code>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-base font-semibold">2. Public JSON Web Key Sets (JWKS)</h3>
        <p className="text-xs text-muted-foreground">
          Clients fetch active public RSA keys to cryptographically verify <code className="text-primary font-mono">id_token</code> JWT signatures:
        </p>
        <div className="p-3 bg-muted rounded-lg border border-border">
          <code className="text-xs font-mono select-all text-primary block">
            GET /.well-known/jwks.json
          </code>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-base font-semibold">3. Standard OIDC UserInfo Endpoint</h3>
        <p className="text-xs text-muted-foreground">
          Pass your Bearer access token to fetch user profile claims:
        </p>
        <div className="p-3 bg-muted rounded-lg border border-border">
          <code className="text-xs font-mono select-all text-primary block">
            GET /api/oauth/userinfo
            <br />
            Header: Authorization: Bearer &lt;access_token&gt;
          </code>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-base font-semibold">4. Enterprise SAML 2.0 SP Metadata</h3>
        <p className="text-xs text-muted-foreground">
          Export AuthGate Service Provider (SP) XML descriptor to configure Okta, Azure AD (Entra ID), or Google Workspace:
        </p>
        <div className="p-3 bg-muted rounded-lg border border-border">
          <code className="text-xs font-mono select-all text-primary block">
            GET /api/auth/saml/metadata
          </code>
        </div>
      </div>
    </div>
  );
}
