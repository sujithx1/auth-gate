# Stage 1: Core Authentication & Session Management

Stage 1 establishes the foundational infrastructure for AuthGate's core user lifecycle management, sessions, and security verification.

---

## 1. Features Implemented

### A. User Management
- **Registration**: Allows signing up users securely. Standardizes emails (lowercasing and trimming) and uses Bun's cryptographically secure hash mechanism.
- **Login**: Verifies credentials against the hashed password stored in the database.
- **Logout**: Revokes active session tokens and clears cookies.
- **User Profile**: `GET /api/auth/me` returns verified user details using session validation.

### B. Session Management
- **Active Sessions**: Creates 30-day session tokens upon successful login, logging user-agent and IP addresses for audit/security.
- **Verification & Expiry**: Verifies tokens from incoming request cookies, deleting expired ones lazily.
- **Revocation**: Deletes active tokens on logout.

### C. Security Flows
- **Email Verification**: Generates a 24-hour verification token during registration. Verification changes `isEmailVerified` to `true` and burns the token.
- **Password Reset**: Generates a 1-hour secure password reset token when requested, updating the password only if the token matches and has not expired.

---

## 2. Directory Layout & Created Files

```text
authgate/
├── packages/
│   ├── shared/
│   │   └── src/
│   │       ├── errors.ts         # Custom AuthGateError types (Conflict, NotFound, Unauthorized)
│   │       ├── crypto.ts         # Password hash/verify & secure token generators
│   │       └── index.ts          # Shared exports
│   ├── core/
│   │   └── src/
│   │       ├── domain/
│   │       │   ├── entities.ts     # User, Session, and VerificationToken models
│   │       │   └── repositories.ts # Repository abstraction interfaces
│   │       ├── testing/
│   │       │   └── in-memory-repositories.ts # Memory repositories for isolated unit testing
│   │       └── index.ts          # Core exports and bootloader options
│   ├── session/
│   │   └── src/
│   │       ├── session.service.ts # Business logic for sessions
│   │       └── index.ts          # Session exports
│   ├── auth/
│   │   └── src/
│   │       ├── auth.service.ts   # Business logic for auth lifecycle
│   │       └── index.ts          # Auth exports
│   └── adapters/
│       └── drizzle/
│           └── src/
│               ├── schema.ts       # Drizzle PostgreSQL DB tables matching core entities
│               ├── repositories.ts # Repository adapters executing queries via Drizzle
│               └── index.ts        # Exports and drizzleAdapter wrapper
└── apps/
    └── auth-server/
        └── src/
            └── index.ts          # REST routes, Hono CORS, cookies, rate limits, and middlewares
```

---

## 3. Endpoints Created

Every route is structured to conform to the API rules:
- Success responses return `{ success: true, data: { ... } }`.
- Error responses return `{ success: false, error: { code, message, details } }`.

| Method | Endpoint | Description | Payload | Cookies Set/Cleared |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/register` | Registers a new user and returns registration details with verification token. | `{ email, password }` | None |
| **POST** | `/api/auth/login` | Validates credentials, spawns a session, and sets the secure session cookie. | `{ email, password }` | `authgate_session` (Set) |
| **POST** | `/api/auth/logout` | Revokes the active session token and clears the cookie. | None | `authgate_session` (Cleared) |
| **POST** | `/api/auth/verify-email` | Marks the user's email verified after validating the token. | `{ token }` | None |
| **POST** | `/api/auth/forgot-password` | Requests a password reset token (logged/returned in JSON for Stage 1 visibility). | `{ email }` | None |
| **POST** | `/api/auth/reset-password` | Updates user password using reset token. | `{ token, newPassword }` | None |
| **GET** | `/api/auth/me` | Fetches active user details using session authorization middleware. | None | None |
