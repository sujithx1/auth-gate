# AuthGate: Stage 5 Documentation

This document describes the specification, architecture, and implementation details for **Stage 5: Enterprise SSO & OpenID Connect (OIDC) Provider** inside AuthGate.

---

## 1. Overview & Architecture

Stage 5 elevates AuthGate from an OAuth 2.1 authorization server into a fully compliant **OpenID Connect (OIDC) Identity Provider (IdP)** and an **Enterprise SAML 2.0 Service Provider (SP)**.

```mermaid
graph TD
    subgraph Clients & IdPs
        OIDCClient[OIDC Client Application]
        EnterpriseIdP[Enterprise IdP: Okta / Azure AD / Google Workspace]
    end

    subgraph AuthGate Server
        Discovery[/.well-known/openid-configuration]
        JWKS[/.well-known/jwks.json]
        UserInfo[/api/oauth/userinfo]
        SAMLACS[/api/auth/saml/acs]
        SPMetadata[/api/auth/saml/metadata]
    end

    OIDCClient -->|Fetch Discovery| Discovery
    OIDCClient -->|Verify ID Token| JWKS
    OIDCClient -->|Fetch Claims| UserInfo

    EnterpriseIdP -->|SAML Assertion POST| SAMLACS
    EnterpriseIdP -->|Import SP Specs| SPMetadata
```

---

## 2. Domain Entities & Schemas

### A. OIDC ID Token & Signing Keys
- **OidcKey**: RSA 2048-bit keypair for signing OIDC `id_token` JWTs.
  - `kid`: Key ID (SHA-256 fingerprint).
  - `alg`: Signing algorithm (`RS256`).
  - `publicKey`: PEM formatted RSA Public Key (published at JWKS endpoint).
  - `privateKey`: Encrypted PEM formatted RSA Private Key.

- **OidcIdToken Claims**:
  - `iss`: AuthGate Issuer URL (e.g. `http://localhost:3003`).
  - `sub`: Authenticated User ID.
  - `aud`: Target Client ID.
  - `exp`: Expiry timestamp (1 hour).
  - `iat`: Issue timestamp.
  - `email`: Authenticated user email address.
  - `email_verified`: Email verification status.
  - `name`: User full name.

### B. Enterprise SAML 2.0 Connection
- **SamlProvider**: Workspace organization enterprise SSO configuration.
  - `id`: Unique system UUID.
  - `organizationId`: Target organization workspace ID.
  - `issuer`: Enterprise IdP Entity ID / Issuer.
  - `ssoUrl`: Enterprise IdP Single Sign-On HTTP POST / Redirect URL.
  - `cert`: X.509 Public Certificate string for verifying SAML Assertions.
  - `enabled`: Status flag.
  - `attributeMapping`: JSON mapping for `email`, `firstName`, `lastName`, and `role`.
  - `createdAt`: Creation timestamp.

---

## 3. OIDC Standard Endpoints

### A. OpenID Provider Discovery (`GET /.well-known/openid-configuration`)
Returns standard OIDC metadata enabling zero-config integration for OIDC client SDKs and third-party applications:
```json
{
  "issuer": "http://localhost:3003",
  "authorization_endpoint": "http://localhost:3003/api/oauth/authorize",
  "token_endpoint": "http://localhost:3003/api/oauth/token",
  "userinfo_endpoint": "http://localhost:3003/api/oauth/userinfo",
  "jwks_uri": "http://localhost:3003/.well-known/jwks.json",
  "response_types_supported": ["code"],
  "subject_types_supported": ["public"],
  "id_token_signing_alg_values_supported": ["RS256"],
  "scopes_supported": ["openid", "profile", "email"],
  "claims_supported": ["sub", "iss", "aud", "exp", "iat", "email", "email_verified", "name"]
}
```

### B. JSON Web Key Sets (`GET /.well-known/jwks.json`)
Exposes active public RSA keys (`RS256`) used by client applications to cryptographically verify `id_token` signatures without contacting the server:
```json
{
  "keys": [
    {
      "kty": "RSA",
      "use": "sig",
      "alg": "RS256",
      "kid": "authgate-key-v1",
      "n": "...",
      "e": "AQAB"
    }
  ]
}
```

### C. Standard UserInfo Endpoint (`GET /api/oauth/userinfo`)
Validates `Bearer <access_token>` in `Authorization` header and returns standardized identity claims:
```json
{
  "sub": "usr_123456",
  "email": "developer@example.com",
  "email_verified": true,
  "name": "Jane Developer"
}
```

---

## 4. Enterprise SAML 2.0 Endpoints

### A. SP XML Metadata (`GET /api/auth/saml/metadata`)
Generates Service Provider (SP) XML Metadata for easy import into Okta, Azure AD (Entra ID), or Google Workspace:
```xml
<EntityDescriptor entityID="http://localhost:3003/api/auth/saml/metadata">
  <SPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="http://localhost:3003/api/auth/saml/acs"/>
  </SPSSODescriptor>
</EntityDescriptor>
```

### B. SAML Initiation (`POST /api/auth/saml/sso`)
Initiates SP-initiated SAML flow by generating a signed `AuthnRequest` XML envelope and redirecting to the Enterprise IdP `ssoUrl`.

### C. Assertion Consumer Service (`POST /api/auth/saml/acs`)
Receives HTTP POST SAML Response assertions from Enterprise IdPs:
1. Validates IdP signature against `SamlProvider.cert`.
2. Extracts user attributes (`email`, `name`, `groups`).
3. Provisions or logs in the user under the workspace organization.
4. Issues an active `authgate_session` cookie and redirects to the application dashboard.
