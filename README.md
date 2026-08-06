# AuthGate

AuthGate is a production-ready, open-source Identity & Access Management (IAM) and Single Sign-On (SSO) platform built with modern technologies. It provides a lightweight, modular alternative to enterprise identity systems.

Designed with **Clean Architecture**, AuthGate is completely framework-agnostic, database-agnostic, and secure by default.

---

## Tech Stack

- **Runtime**: [Bun](https://bun.sh)
- **Backend API**: [Hono](https://hono.dev)
- **Language**: [TypeScript](https://www.typescriptlang.org)
- **Database ORM**: [Drizzle ORM](https://orm.drizzle.team)
- **Database Driver**: [PostgreSQL](https://www.postgresql.org)

---

## Architecture Principles

AuthGate follows **Clean Architecture** boundaries:
- **Domain & Core Interfaces (`@authgate/core`)**: Zero third-party runtime dependencies on frameworks or databases. It specifies domain entities (`User`, `Session`, etc.) and abstract repository interfaces (`UserRepository`, `SessionRepository`, etc.).
- **Application Services (`@authgate/auth`, `@authgate/session`)**: Contains business logic implementation such as password hashing, registration, and session validations.
- **Infrastructure / Adapters (`@authgate/drizzle`)**: Database adapters wrapping ORMs or APIs to store state.
- **Presentation Server (`apps/auth-server`)**: A lightweight Hono server implementing HTTP controllers, session-cookie validation, and REST API request routing.

---

## Repository Structure

```text
authgate/
├── apps/
│   └── auth-server/       # Hono REST API server
├── packages/
│   ├── core/              # Domain entities, repositories & test utilities
│   ├── auth/              # Registration, login, validation services
│   ├── session/           # Session management services
│   ├── shared/            # Common errors and cryptographic utilities
│   └── adapters/
│       └── drizzle/       # PostgreSQL storage adapter via Drizzle ORM
├── package.json           # Bun workspaces root configuration
└── tsconfig.json          # Root TS compiler configuration
```

---

## Stage 1 Features Implemented

- [x] **User Registration** (Secure password hashing using Argon2id/bcrypt)
- [x] **Secure Authentication & Session Cookie Management** (HttpOnly, Secure, SameSite cookie rotation)
- [x] **Email Verification Flow** (Generate & verify tokens with expiry protection)
- [x] **Password Reset Flow** (Forgot password token generation & reset completion)
- [x] **User context retrieval** (`GET /api/auth/me` with session validation middleware)
- [x] **Mock Testing Layer** (In-memory repositories enabling unit testing without databases)

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) installed globally.
- PostgreSQL database (optional for tests, required to run the server).

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd authgate

# Install workspace dependencies
bun install
```

### Running Tests

To run the unit tests for core services (Auth, Sessions, and in-memory adapter):

```bash
bun test
```

### Running the API Server

1. Set the database connection URL:
   ```bash
   export DATABASE_URL="postgres://username:password@localhost:5432/authgatedb"
   ```
2. Start the Hono server:
   ```bash
   bun run apps/auth-server/src/index.ts
   ```
   The server will start on port `3000`.
