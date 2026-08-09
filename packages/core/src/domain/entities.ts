export interface User {
  id: string;
  email: string;
  passwordHash: string;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  userAgent?: string;
  ipAddress?: string;
  createdAt: Date;
}

export type VerificationTokenType = "EMAIL_VERIFICATION" | "PASSWORD_RESET";

export interface VerificationToken {
  id: string;
  userId: string;
  token: string;
  type: VerificationTokenType;
  expiresAt: Date;
  createdAt: Date;
}

export interface TwoFactorSecret {
  id: string;
  userId: string;
  secret: string;
  isActive: boolean;
  backupCodes: string[];
  createdAt: Date;
}
