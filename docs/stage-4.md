# AuthGate: Stage 4 Documentation

This document describes the design and implementation of **Stage 4: Multi-Factor Authentication & OTP Mediator** inside AuthGate.

---

## 1. Domain Entities & Database Schemas

### Two-Factor Authentication (TOTP)
- **TwoFactorSecret**: Holds the active authenticator configurations for users.
  - `id`: unique system UUID.
  - `userId`: owner reference ID (unique/one-to-one).
  - `secret`: Base32-encoded secure key.
  - `isActive`: activation confirmation flag.
  - `backupCodes`: JSON array of hashed recovery codes.
  - `createdAt`: registration timestamp.

### Decoupled OTP Codes
- **OtpCode**: Stores active verification codes mapped to temporary sessions.
  - `id`: unique code identity.
  - `identifier`: email address or phone number (unique).
  - `codeHash`: hashed verification code (SHA-256 password hash).
  - `expiresAt`: expiry timestamp.
  - `attempts`: code verification attempt counter (max 3).
  - `createdAt`: creation timestamp.

---

## 2. API Endpoints

### Two-Factor Authentication (`/api/auth/2fa`)
- `POST /enable`: Generates a random Base32 TOTP secret and returns the provisioning QR URI (protected).
- `POST /verify`: Validates the first code to set `isActive = true` and returns 10 backup codes (protected).
- `POST /disable`: Disables and deletes the 2FA secret after code verification (protected).
- `POST /login/verify-2fa`: Second step of login to verify TOTP code or backup code and issue the session token.

### Decoupled OTP Mediator (`/api/auth/otp`)
- `POST /generate`: Generates a secure numeric OTP code of custom length and expiry, hashes it, and returns the raw plain code to the developer's server.
- `POST /verify`: Verifies the code, deletes the OTP record, registers the user if new, and establishes the active session.
