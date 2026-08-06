# AuthGate: Stage 3 Documentation

This document describes the design and implementation of **Stage 3: OAuth 2.1 Server Core** inside AuthGate.

---

## 1. Domain Entities & Database Schemas

### OAuth 2.1 Client Application
- **OAuthClient**: Holds registered third-party configurations.
  - `id`: unique system uuid
  - `name`: user-facing application name
  - `clientId`: unique public identifier
  - `clientSecret`: confidential credentials secret key
  - `redirectUris`: array of authorized callback URLs
  - `allowedGrantTypes`: allowed grant formats (e.g. `authorization_code`, `refresh_token`)
  - `userId`: developer owner ID

### Authorization Codes & Access/Refresh Tokens
- **OAuthAuthorizationCode**: Temporary codes used to swap for tokens. Mapped with PKCE validation parameters (`codeChallenge`, `codeChallengeMethod`).
- **OAuthToken**: Access and refresh tokens generated upon authorization approval.

---

## 2. API Endpoints

### Developer Console Client Registration (`/api/oauth/clients`)
- `POST /`: Registers a new OAuth Client (Requires developer context).
- `GET /`: Lists all applications registered by the developer.

### OAuth 2.1 Authorization Flows (`/api/oauth`)
- `GET /authorize`: Validates Client ID and Redirect URI consent parameters.
- `POST /authorize`: Approves consent screen request and generates the redirect URL containing the authorization `code` parameters.
- `POST /token`: Exchanges authorization `code` (with PKCE challenge calculations) or `refresh_token` for new access/refresh tokens.
