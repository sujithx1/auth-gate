import { OAuthClient, OAuthAuthorizationCode, OAuthToken, OAuthRepository, UserRepository } from "@authgate/core";
import { NotFoundError, ValidationError, generateSecureToken } from "@authgate/shared";

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


// In production, persist these keys in the database (OidcKey table).
interface RsaKeyPair {
  privateKey: CryptoKey;
  publicJwk: JsonWebKey;
  kid: string;
}

let _rsaKeyPair: RsaKeyPair | null = null;

async function getOrCreateRsaKeyPair(): Promise<RsaKeyPair> {
  if (_rsaKeyPair) return _rsaKeyPair;

  const keyPair = await globalThis.crypto.subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["sign", "verify"]
  );

  const publicJwk = await globalThis.crypto.subtle.exportKey("jwk", keyPair.publicKey);
  const kid = `authgate-key-${Date.now()}`;

  _rsaKeyPair = { privateKey: keyPair.privateKey, publicJwk, kid };
  return _rsaKeyPair;
}

export class OAuthService {
  private _jwks: { keys: JsonWebKey[] } | null = null;

  constructor(private readonly oauthRepo: OAuthRepository) {
    // Eagerly warm up the RSA key pair in the background
    getOrCreateRsaKeyPair().then((kp) => {
      this._jwks = {
        keys: [{ ...kp.publicJwk, use: "sig", alg: "RS256", kid: kp.kid }],
      };
    });
  }

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
    // Return the cached JWKS (populated during construction).
    // If keys aren't ready yet return empty set — client can retry.
    return this._jwks ?? { keys: [] };
  }

  /**
   * Generate a real RS256-signed OIDC ID Token JWT.
   * The token is signed with the in-process RSA private key.
   */
  async generateIdToken(
    user: { id: string; email: string; name?: string; emailVerified?: boolean },
    clientId: string,
    baseUrl: string,
    nonce?: string
  ): Promise<string> {
    const kp = await getOrCreateRsaKeyPair();
    // Update JWKS cache whenever we generate a token
    this._jwks = {
      keys: [{ ...kp.publicJwk, use: "sig", alg: "RS256", kid: kp.kid }],
    };

    const origin = baseUrl.replace(/\/+$/, "");
    const now = Math.floor(Date.now() / 1000);

    const header = Buffer.from(
      JSON.stringify({ alg: "RS256", typ: "JWT", kid: kp.kid })
    ).toString("base64url");

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

    const signingInput = `${header}.${payload}`;
    const signingBuffer = Buffer.from(signingInput, "utf-8");

    const signatureBuffer = await globalThis.crypto.subtle.sign(
      { name: "RSASSA-PKCS1-v1_5" },
      kp.privateKey,
      signingBuffer
    );

    const signature = Buffer.from(signatureBuffer).toString("base64url");
    return `${header}.${payload}.${signature}`;
  }
}
