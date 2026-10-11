# AuthGate: Security Hardening & OIDC Key Management

This document describes server configuration, security behaviour, and the OIDC/OAuth provider as they work today. It supersedes the "mock/dev" notes in earlier stage docs where they conflict.

---

## 1. Server configuration

`createAuthGateServer(config)` (from `@authgate/server`) accepts:

| Option | Type | Description |
|---|---|---|
| `database` | `DatabaseAdapter` | Required. e.g. `drizzleAdapter(db)`. Must include `oidcKeys`. |
| `allowedOrigins` | `string[]` | Origins allowed as post-login redirect targets. The first entry is the default. |
| `cookieOptions.secure` | `boolean` | Use `true` in production. Switches the session cookie to `SameSite=None; Secure`. |
| `publicUrl` | `string` | Public base URL, used as the OIDC `issuer`. |
| `providers.google` / `providers.github` | `{ clientId, clientSecret }` | Enables social login. |
| `oidcKeyEncryptionSecret` | `string` | Encrypts OIDC private signing keys at rest (AES-GCM). **Set this in production.** |
| `devMode` | `boolean` | Development only. See below. |
| `hooks` | `{ sendVerificationEmail, sendPasswordReset, sendOtp }` | Delivery callbacks for out-of-band secrets. |

### Token delivery and `devMode`

Verification tokens, password-reset tokens and OTP codes are **never returned in API responses** by default. Provide `hooks` to deliver them (email, SMS, ...):

```ts
createAuthGateServer({
  database: drizzleAdapter(db),
  hooks: {
    sendVerificationEmail: (email, token) => mailer.send(email, `Verify: ${APP_URL}/verify/${token}`),
    sendPasswordReset: (email, token) => mailer.send(email, `Reset: ${APP_URL}/reset/${token}`),
    sendOtp: (identifier, code) => sms.send(identifier, `Your code: ${code}`),
  },
});
```

With `devMode: true` the secrets are also echoed in responses and the mock social-login routes are enabled, so the UIs work without an email provider. **Never enable `devMode` in production.**

---

## 2. Security behaviour

- **Rate limiting**: `register`, `login`, `login/verify-2fa`, `otp/generate`, `otp/verify`, `forgot-password`, `reset-password`, `2fa/verify`, `2fa/disable` allow 10 requests per minute per IP and path (HTTP 429, code `RATE_LIMITED`). The limiter is in-memory and per process; use a shared limiter (e.g. at the proxy) when running several instances. The IP is taken from `x-forwarded-for`, so only deploy behind a proxy you trust.
- **Sessions**: HttpOnly cookie `authgate_session`, 30-day expiry. Cookie options are identical on every login path.
- **Social login CSRF**: a random `state` is stored in a short-lived HttpOnly cookie and verified in the callback. The post-login return URL must match `allowedOrigins`.
- **OTP**: codes are generated with `crypto.randomInt`, stored hashed, limited to 3 attempts.
- **Login timing**: unknown emails perform a dummy hash to reduce user enumeration through timing.
- **SAML**: `POST /auth/saml/acs` returns `501`. Assertions are not yet signature-validated, so SAML login is intentionally disabled.

---

## 3. OAuth 2.1 / OIDC provider

Endpoints (mounted under your chosen prefix, e.g. `/api`):

| Endpoint | Purpose |
|---|---|
| `POST /oauth/clients`, `GET /oauth/clients` | Register / list client apps (session required) |
| `GET /oauth/authorize` | Validate an authorization request |
| `POST /oauth/authorize` | Approve consent, returns `redirectUrl` with `code` |
| `POST /oauth/token` | `authorization_code` and `refresh_token` grants |
| `GET /oauth/userinfo` | OIDC claims; requires `Authorization: Bearer <access_token>` |
| `GET /.well-known/openid-configuration` | Discovery document |
| `GET /.well-known/jwks.json` | Public signing keys |

Rules enforced:

- **PKCE is mandatory, S256 only.** `plain` is rejected when the code is created.
- **Client authentication is required** at the token endpoint (`client_secret`), compared in constant time.
- **Authorization codes are single-use.** A code is consumed on first lookup, even if the exchange then fails.
- **`nonce`**: send `nonce` in the `POST /oauth/authorize` body; it is returned in the `id_token` issued from that code.
- An `id_token` is issued when the granted scope includes `openid`.

### Example flow

1. Client generates `code_verifier` and `code_challenge = BASE64URL(SHA256(verifier))`.
2. User approves: `POST /oauth/authorize { clientId, redirectUri, codeChallenge, codeChallengeMethod: "S256", scope: "openid profile email", nonce }`.
3. Client exchanges the code: `POST /oauth/token` (form-encoded) with `grant_type=authorization_code`, `code`, `client_id`, `client_secret`, `code_verifier`.
4. Client verifies the `id_token` signature against `/.well-known/jwks.json` and checks `nonce`.

See `apps/test-client` for a working client (set `CLIENT_ID` and `CLIENT_SECRET`).

---

## 4. OIDC signing keys

- RS256 keys are stored in the `oidc_keys` table, so ID tokens remain valid across restarts and instances share the same keys.
- The newest key signs new tokens. All keys are published in the JWKS.
- **Rotation**: call `oauthService.rotateKey()`. Old keys stay in the JWKS so tokens signed before rotation still verify. Remove old keys from the table once their tokens have expired (ID tokens live 1 hour).
- **Encryption at rest**: with `oidcKeyEncryptionSecret`, private keys are stored as `aes:<iv>.<ciphertext>`. Without it they are stored as `plain:<jwk>`. Changing the secret makes existing encrypted keys unreadable, so rotate keys first.

---

## 5. Database migration

After upgrading run:

```bash
bun run db:push
```

This adds the `oidc_keys` table and the `nonce` column on `oauth_authorization_codes`.

---

## 6. Known limitations / roadmap

- SAML SSO login is not implemented (signature, issuer, audience and expiry validation are required).
- OAuth client secrets and 2FA backup codes are stored in plaintext.
- Scopes are not validated or restricted per client.
- Access tokens are opaque (not JWTs); the refresh grant does not carry the `nonce`.
- The rate limiter is per process.
