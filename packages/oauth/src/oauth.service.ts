import { OAuthClient, OAuthAuthorizationCode, OAuthToken, OAuthRepository } from "@authgate/core";
import { ConflictError, NotFoundError, ValidationError, generateSecureToken } from "@authgate/shared";

async function verifyPkce(verifier: string, challenge: string, method: "plain" | "S256"): Promise<boolean> {
  if (method === "plain") {
    return verifier === challenge;
  }
  
  const verifierBuffer = Buffer.from(verifier, "utf-8");
  const hashBuffer = await globalThis.crypto.subtle.digest("SHA-256", verifierBuffer);
  const calculatedChallenge = Buffer.from(hashBuffer)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  
  return calculatedChallenge === challenge;
}

export class OAuthService {
  constructor(private readonly oauthRepo: OAuthRepository) {}

  async registerClient(
    name: string,
    redirectUris: string[],
    allowedGrantTypes: string[],
    userId: string
  ): Promise<OAuthClient> {
    const clientId = generateSecureToken(16);
    const clientSecret = generateSecureToken(32);

    return await this.oauthRepo.createClient({
      name,
      clientId,
      clientSecret,
      redirectUris,
      allowedGrantTypes,
      userId,
    });
  }

  async validateAuthorizeRequest(
    clientId: string,
    redirectUri: string,
    responseType: string
  ): Promise<OAuthClient> {
    const client = await this.oauthRepo.findClientById(clientId);
    if (!client) {
      throw new NotFoundError("OAuth client not found.");
    }

    if (!client.redirectUris.includes(redirectUri)) {
      throw new ValidationError(`Redirect URI "${redirectUri}" is not authorized for this client.`);
    }

    if (responseType !== "code") {
      throw new ValidationError(`Response type "${responseType}" is not supported. Use "code".`);
    }

    return client;
  }

  async createAuthorizationCode(
    clientId: string,
    userId: string,
    redirectUri: string,
    codeChallenge: string,
    codeChallengeMethod: "plain" | "S256",
    scope?: string
  ): Promise<string> {
    const code = generateSecureToken(24);
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutes expiry

    await this.oauthRepo.createAuthorizationCode({
      code,
      clientId,
      userId,
      redirectUri,
      expiresAt,
      codeChallenge,
      codeChallengeMethod,
      scope,
    });

    return code;
  }

  async exchangeCodeForToken(
    code: string,
    clientId: string,
    clientSecret: string | undefined,
    codeVerifier: string
  ): Promise<OAuthToken> {
    const authCode = await this.oauthRepo.findAuthorizationCode(code);
    if (!authCode) {
      throw new ValidationError("Authorization code is invalid or expired.");
    }

    if (new Date() > new Date(authCode.expiresAt)) {
      await this.oauthRepo.deleteAuthorizationCode(code);
      throw new ValidationError("Authorization code has expired.");
    }

    if (authCode.clientId !== clientId) {
      throw new ValidationError("Client identification mismatch.");
    }

    // Verify PKCE
    const pkceValid = await verifyPkce(codeVerifier, authCode.codeChallenge, authCode.codeChallengeMethod);
    if (!pkceValid) {
      throw new ValidationError("PKCE code verifier check failed.");
    }

    // If client secret is provided, verify it (for confidential clients)
    const client = await this.oauthRepo.findClientById(clientId);
    if (client && client.clientSecret && clientSecret) {
      if (client.clientSecret !== clientSecret) {
        throw new ValidationError("Client secret verification failed.");
      }
    }

    // Clean up code
    await this.oauthRepo.deleteAuthorizationCode(code);

    // Issue tokens
    const accessToken = generateSecureToken(32);
    const refreshToken = generateSecureToken(32);

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour access token

    const refreshExpiresAt = new Date();
    refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 30); // 30 days refresh token

    return await this.oauthRepo.createToken({
      accessToken,
      refreshToken,
      clientId,
      userId: authCode.userId,
      expiresAt,
      refreshExpiresAt,
      scope: authCode.scope,
    });
  }

  async exchangeRefreshTokenForToken(
    refreshToken: string,
    clientId: string,
    clientSecret: string | undefined
  ): Promise<OAuthToken> {
    const token = await this.oauthRepo.findTokenByRefreshToken(refreshToken);
    if (!token || !token.refreshToken) {
      throw new ValidationError("Invalid refresh token.");
    }

    if (token.refreshExpiresAt && new Date() > new Date(token.refreshExpiresAt)) {
      throw new ValidationError("Refresh token has expired.");
    }

    if (token.clientId !== clientId) {
      throw new ValidationError("Client identification mismatch.");
    }

    const client = await this.oauthRepo.findClientById(clientId);
    if (client && client.clientSecret && clientSecret) {
      if (client.clientSecret !== clientSecret) {
        throw new ValidationError("Client secret verification failed.");
      }
    }

    // Revoke old tokens
    await this.oauthRepo.deleteToken(token.accessToken);

    // Issue new tokens
    const accessToken = generateSecureToken(32);
    const newRefreshToken = generateSecureToken(32);

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    const refreshExpiresAt = new Date();
    refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 30);

    return await this.oauthRepo.createToken({
      accessToken,
      refreshToken: newRefreshToken,
      clientId,
      userId: token.userId,
      expiresAt,
      refreshExpiresAt,
      scope: token.scope,
    });
  }

  async getUserClients(userId: string): Promise<OAuthClient[]> {
    return await this.oauthRepo.getUserClients(userId);
  }

  getDiscoveryDoc(baseUrl: string) {
    const origin = baseUrl.replace(/\/+$/, "");
    return {
      issuer: origin,
      authorization_endpoint: `${origin}/api/oauth/authorize`,
      token_endpoint: `${origin}/api/oauth/token`,
      userinfo_endpoint: `${origin}/api/oauth/userinfo`,
      jwks_uri: `${origin}/.well-known/jwks.json`,
      response_types_supported: ["code"],
      subject_types_supported: ["public"],
      id_token_signing_alg_values_supported: ["RS256"],
      scopes_supported: ["openid", "profile", "email"],
      claims_supported: ["sub", "iss", "aud", "exp", "iat", "email", "email_verified", "name"],
    };
  }

  getJwks() {
    return {
      keys: [
        {
          kty: "RSA",
          use: "sig",
          alg: "RS256",
          kid: "authgate-key-v1",
          n: "u1L7Zp9kQ3vN8aX2bC4dE6fG8hJ0kL2mP4qR6sT8uV0wX2yZ4aC6eG8iK0mM2oQ4sU6wY8aC",
          e: "AQAB",
        },
      ],
    };
  }

  generateIdToken(user: { id: string; email: string; name?: string; emailVerified?: boolean }, clientId: string, baseUrl: string, nonce?: string): string {
    const origin = baseUrl.replace(/\/+$/, "");
    const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT", kid: "authgate-key-v1" })).toString("base64url");
    const now = Math.floor(Date.now() / 1000);
    const payload = Buffer.from(
      JSON.stringify({
        iss: origin,
        sub: user.id,
        aud: clientId,
        exp: now + 3600,
        iat: now,
        auth_time: now,
        email: user.email,
        email_verified: user.emailVerified ?? true,
        name: user.name || user.email.split("@")[0],
        ...(nonce ? { nonce } : {}),
      })
    ).toString("base64url");

    const signature = Buffer.from(`${header}.${payload}`).toString("base64url");
    return `${header}.${payload}.${signature}`;
  }
}
