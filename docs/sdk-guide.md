# AuthGate SDK Integration Guide

This guide explains how developers use the **`@sujithx/authgate` SDK** to integrate authentication, user session management, and OIDC Client SSO in their applications.

---

## 1. Installation

```bash
npm install @sujithx/authgate
```

---

## 2. Initializing `AuthGateClient`

```ts
import { AuthGateClient } from "@sujithx/authgate";

export const authgate = new AuthGateClient({
  baseUrl: "http://localhost:3003", // Point to AuthGate Server
});
```

---

## 3. OIDC Client Authentication Flow (PKCE)

### Step 1: Generate Authorization Redirect URL
```ts
const loginUrl = authgate.createAuthorizationUrl({
  clientId: "YOUR_CLIENT_ID",
  redirectUri: "http://localhost:5173/callback",
  scope: "openid profile email",
  codeChallenge: "PKCE_CHALLENGE",
  codeChallengeMethod: "S256",
});

window.location.href = loginUrl;
```

### Step 2: Handle OAuth Callback & Exchange Token
```ts
const code = new URLSearchParams(window.location.search).get("code");

if (code) {
  const tokens = await authgate.exchangeCodeForToken({
    clientId: "YOUR_CLIENT_ID",
    code,
    codeVerifier: "PKCE_VERIFIER",
  });

  // Access Token & OIDC ID Token
  const accessToken = tokens.access_token;
  const idToken = tokens.id_token;

  // Fetch standard UserInfo profile
  const user = await authgate.getUserInfo(accessToken);
  console.log("Logged in OIDC user:", user);
}
```

---

## 4. OIDC Discovery & JWKS Validation

```ts
// Fetch standard discovery metadata
const discovery = await authgate.getOidcDiscovery();

// Fetch RSA Public Keys
const jwks = await authgate.getJwks();
```
