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
}

export type Env = {
  Variables: {
    user: any;
    session: any;
    orgId?: string;
  };
};
