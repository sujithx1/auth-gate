import { AuthGateDatabase } from "@authgate/core";

export interface GoogleProviderConfig {
  clientId: string;
  clientSecret: string;
}

export interface GithubProviderConfig {
  clientId: string;
  clientSecret: string;
}

export interface AuthGateServerConfig {
  database: AuthGateDatabase;
  providers?: {
    google?: GoogleProviderConfig;
    github?: GithubProviderConfig;
  };
  allowedOrigins?: string[];
  cookieOptions?: {
    secure?: boolean;
    sameSite?: "Lax" | "Strict" | "None";
  };
  publicUrl?: string; // e.g. http://localhost:3004
  /**
   * Development mode. When true, secrets that should be delivered out-of-band
   * (verification/reset tokens, OTP codes) are echoed in API responses and the
   * mock social login routes are enabled. NEVER enable in production.
   */
  devMode?: boolean;
  /** Delivery hooks used to send tokens/codes to users (email, SMS, ...). */
  hooks?: {
    sendVerificationEmail?: (email: string, token: string) => Promise<void> | void;
    sendPasswordReset?: (email: string, token: string) => Promise<void> | void;
    sendOtp?: (identifier: string, code: string) => Promise<void> | void;
  };
}

export type Env = {
  Variables: {
    user: any;
    session: any;
    orgId?: string;
  };
};
