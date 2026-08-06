export interface OAuthClient {
  id: string;
  name: string;
  clientId: string;
  clientSecret: string;
  redirectUris: string[];
  allowedGrantTypes: string[];
  userId: string; // Owner of the client application
  createdAt: Date;
}

export interface OAuthAuthorizationCode {
  id: string;
  code: string;
  clientId: string;
  userId: string;
  redirectUri: string;
  expiresAt: Date;
  codeChallenge: string;
  codeChallengeMethod: "plain" | "S256";
  scope?: string;
  createdAt: Date;
}

export interface OAuthToken {
  id: string;
  accessToken: string;
  refreshToken?: string;
  clientId: string;
  userId: string;
  expiresAt: Date;
  refreshExpiresAt?: Date;
  scope?: string;
  createdAt: Date;
}

export interface OAuthRepository {
  createClient(client: Omit<OAuthClient, "id" | "createdAt">): Promise<OAuthClient>;
  findClientById(clientId: string): Promise<OAuthClient | null>;
  getUserClients(userId: string): Promise<OAuthClient[]>;
  createAuthorizationCode(code: Omit<OAuthAuthorizationCode, "id" | "createdAt">): Promise<OAuthAuthorizationCode>;
  findAuthorizationCode(code: string): Promise<OAuthAuthorizationCode | null>;
  deleteAuthorizationCode(code: string): Promise<void>;
  createToken(token: Omit<OAuthToken, "id" | "createdAt">): Promise<OAuthToken>;
  findTokenByAccessToken(accessToken: string): Promise<OAuthToken | null>;
  findTokenByRefreshToken(refreshToken: string): Promise<OAuthToken | null>;
  deleteToken(accessToken: string): Promise<void>;
}
