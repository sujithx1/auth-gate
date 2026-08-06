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
}
