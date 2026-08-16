# @sujithx/authgate

Official TypeScript / JavaScript SDK for **AuthGate** — The modern, developer-first Identity and Access Management (IAM) platform.

---

## 📦 Installation

```bash
npm install @sujithx/authgate
# or
bun add @sujithx/authgate
```

---

## 🚀 Quick Start

```ts
import { AuthGateClient } from "@sujithx/authgate";

const authgate = new AuthGateClient({
  baseUrl: "http://localhost:3003", // Your AuthGate Server URL
});
```

---

## 🔑 Authentication APIs

### 1. User Credentials Login
```ts
const res = await authgate.login("user@example.com", "Password123!");
console.log(res.data.user);
```

### 2. User Registration
```ts
const res = await authgate.register("newuser@example.com", "Password123!");
```

### 3. Fetch Current Authenticated User
```ts
const user = await authgate.me();
```

### 4. Logout
```ts
await authgate.logout();
```

---

## 🌐 OpenID Connect (OIDC) Client App Integration

Build OIDC Client Applications with PKCE using AuthGate as your Identity Provider:

### 1. Build OIDC Authorization URL
```ts
const authUrl = authgate.createAuthorizationUrl({
  clientId: "YOUR_REGISTERED_CLIENT_ID",
  redirectUri: "http://localhost:5173/callback",
  scope: "openid profile email",
  codeChallenge: "PKCE_CODE_CHALLENGE",
  codeChallengeMethod: "S256",
  state: "secure_random_state",
});

// Redirect user to AuthGate consent page
window.location.href = authUrl;
```

### 2. Exchange Code for Tokens
```ts
const tokens = await authgate.exchangeCodeForToken({
  clientId: "YOUR_REGISTERED_CLIENT_ID",
  code: "AUTHORIZATION_CODE_FROM_URL",
  codeVerifier: "PKCE_CODE_VERIFIER",
});

console.log("Access Token:", tokens.access_token);
console.log("OIDC ID Token:", tokens.id_token);
```

### 3. Fetch OIDC UserInfo Claims
```ts
const userProfile = await authgate.getUserInfo(tokens.access_token);
console.log(userProfile);
// { sub: "usr_123", email: "user@example.com", email_verified: true, name: "User" }
```

### 4. Fetch OIDC Discovery & JWKS
```ts
const discovery = await authgate.getOidcDiscovery();
const jwks = await authgate.getJwks();
```

---

## 🔒 Multi-Factor Authentication (2FA)

```ts
// 1. Enable TOTP
const { secret, uri } = await authgate.enableTwoFactor();

// 2. Verify Passcode
await authgate.verifyTwoFactor("124567");

// 3. Disable TOTP
await authgate.disableTwoFactor("124567");
```

---

## 🏢 Organization & Multi-Tenancy Management

```ts
// Create Organization
await authgate.createOrganization("Acme Corp", "acme");

// List User Organizations
const orgs = await authgate.getOrganizations();

// Invite Member
await authgate.inviteMember("ORG_ID", "member@acme.com", "MEMBER");

// Accept Invitation
await authgate.acceptInvitation("INVITE_TOKEN");
```

---

## 📄 License

MIT © [Sujith](https://github.com/sujithx1)
