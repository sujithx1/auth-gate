import { OAuthClient, OAuthAuthorizationCode, OAuthToken, OAuthRepository, OidcKey, OidcKeyRepository } from "@authgate/core";
import { timingSafeEqual } from "crypto";
import { NotFoundError, ValidationError, generateSecureToken } from "@authgate/shared";

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

async function verifyPkce(verifier: string, challenge: string, method: "plain" | "S256"): Promise<boolean> {
  if (method !== "S256") return false;
  const verifierBuffer = Buffer.from(verifier, "utf-8");
  const hashBuffer = await globalThis.crypto.subtle.digest("SHA-256", verifierBuffer);
  const calculatedChallenge = Buffer.from(hashBuffer)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return safeEqual(calculatedChallenge, challenge);
}


interface SigningKey {
  kid: string;
  privateKey: CryptoKey;
  publicJwk: JsonWebKey;
}

const RSA_PARAMS = { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" } as const;

async function aesKey(secret: string): Promise<CryptoKey> {
  const digest = await globalThis.crypto.subtle.digest("SHA-256", Buffer.from(secret, "utf-8"));
  return globalThis.crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"]);
}

async function sealPrivateJwk(jwk: JsonWebKey, secret?: string): Promise<string> {
  const json = JSON.stringify(jwk);
  if (!secret) return `plain:${json}`;
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const ct = await globalThis.crypto.subtle.encrypt({ name: "AES-GCM", iv }, await aesKey(secret), Buffer.from(json));
  return `aes:${Buffer.from(iv).toString("base64")}.${Buffer.from(ct).toString("base64")}`;
}

async function openPrivateJwk(data: string, secret?: string): Promise<JsonWebKey> {
  if (data.startsWith("plain:")) return JSON.parse(data.slice(6));
  if (!secret) throw new Error("OIDC signing keys are encrypted but no encryption secret was configured.");
  const [iv, ct] = data.slice(4).split(".");
  const pt = await globalThis.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: Buffer.from(iv, "base64") },
    await aesKey(secret),
    Buffer.from(ct, "base64")
  );
  return JSON.parse(Buffer.from(pt).toString("utf-8"));
}

export interface OAuthServiceOptions {
  /** Persists OIDC signing keys. Without it, keys live in memory and change on restart. */
  keyRepo?: OidcKeyRepository;
  /** Secret used to encrypt private signing keys at rest (AES-GCM). */
  keyEncryptionSecret?: string;
}

export class OAuthService {
  private keys: SigningKey[] | null = null;
  private keysPromise: Promise<SigningKey[]> | null = null;
  private readonly memoryKeys: Omit<OidcKey, "id" | "createdAt">[] = [];

  constructor(
    private readonly oauthRepo: OAuthRepository,
    private readonly options: OAuthServiceOptions = {}
  ) {
    // Warm up keys in the background; failures surface on first use.
    this.loadKeys().catch(() => {});
  }

  /** Loads signing keys (newest first), generating the first one if none exist. */
  private loadKeys(): Promise<SigningKey[]> {
    if (this.keys) return Promise.resolve(this.keys);
    this.keysPromise ??= (async () => {
      let rows = this.options.keyRepo ? await this.options.keyRepo.findAll() : [...this.memoryKeys].reverse();
      if (rows.length === 0) {
        await this.createKey();
        rows = this.options.keyRepo ? await this.options.keyRepo.findAll() : [...this.memoryKeys].reverse();
      }
      const keys = await Promise.all(
        rows.map(async (row) => ({
          kid: row.kid,
          publicJwk: row.publicJwk as JsonWebKey,
          privateKey: await globalThis.crypto.subtle.importKey(
            "jwk",
            await openPrivateJwk(row.privateKeyData, this.options.keyEncryptionSecret),
            RSA_PARAMS,
            false,
            ["sign"]
          ),
        }))
      );
      this.keys = keys;
      return keys;
    })().finally(() => {
      this.keysPromise = null;
    });
    return this.keysPromise;
  }

  private async createKey(): Promise<void> {
    const pair = await globalThis.crypto.subtle.generateKey(
      { ...RSA_PARAMS, modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]) },
      true,
      ["sign", "verify"]
    );
    const row = {
      kid: `authgate-key-${Date.now()}-${generateSecureToken(4)}`,
      publicJwk: (await globalThis.crypto.subtle.exportKey("jwk", pair.publicKey)) as Record<string, unknown>,
      privateKeyData: await sealPrivateJwk(
        await globalThis.crypto.subtle.exportKey("jwk", pair.privateKey),
        this.options.keyEncryptionSecret
      ),
    };
    if (this.options.keyRepo) await this.options.keyRepo.create(row);
    else this.memoryKeys.push(row);
  }

  /**
   * Generates a new signing key and makes it active. Old keys stay in the JWKS
   * so tokens signed before the rotation still verify.
   */
  async rotateKey(): Promise<void> {
    await this.loadKeys();
    await this.createKey();
    this.keys = null;
    await this.loadKeys();
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
    scope?: string,
    nonce?: string
  ): Promise<string> {
    if (codeChallengeMethod !== "S256" || !codeChallenge) {
      throw new ValidationError("PKCE with code_challenge_method S256 is required.");
    }

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
      nonce,
    });

    return code;
  }

  async exchangeCodeForToken(
    code: string,
    clientId: string,
    clientSecret: string | undefined,
    codeVerifier: string
  ): Promise<OAuthToken & { nonce?: string }> {
    const authCode = await this.oauthRepo.findAuthorizationCode(code);
    if (!authCode) {
      throw new ValidationError("Authorization code is invalid or expired.");
    }

    // Codes are single-use: consume immediately, whatever the outcome.
    await this.oauthRepo.deleteAuthorizationCode(code);

    if (new Date() > new Date(authCode.expiresAt)) {
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

    await this.authenticateClient(clientId, clientSecret);

    // Issue tokens
    const accessToken = generateSecureToken(32);
    const refreshToken = generateSecureToken(32);

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour access token

    const refreshExpiresAt = new Date();
    refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 30); // 30 days refresh token

    const issued = await this.oauthRepo.createToken({
      accessToken,
      refreshToken,
      clientId,
      userId: authCode.userId,
      expiresAt,
      refreshExpiresAt,
      scope: authCode.scope,
    });
    return { ...issued, nonce: authCode.nonce };
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

    await this.authenticateClient(clientId, clientSecret);

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

  private async authenticateClient(clientId: string, clientSecret: string | undefined): Promise<OAuthClient> {
    const client = await this.oauthRepo.findClientById(clientId);
    if (!client || !clientSecret || !safeEqual(client.clientSecret, clientSecret)) {
      throw new ValidationError("Client authentication failed.");
    }
    return client;
  }

  /**
   * Resolves a Bearer access token to its stored token record, or null if
   * unknown/expired.
   */
  async validateAccessToken(accessToken: string): Promise<OAuthToken | null> {
    const token = await this.oauthRepo.findTokenByAccessToken(accessToken);
    if (!token || new Date() > new Date(token.expiresAt)) return null;
    return token;
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

  async getJwks() {
    const keys = await this.loadKeys();
    return { keys: keys.map((k) => ({ ...k.publicJwk, use: "sig", alg: "RS256", kid: k.kid })) };
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
    const [kp] = await this.loadKeys();

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
