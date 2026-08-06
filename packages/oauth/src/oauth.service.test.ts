import { describe, expect, it, beforeEach } from "bun:test";
import { createInMemoryAdapter } from "@authgate/core";
import { OAuthService } from "./oauth.service";

describe("OAuthService", () => {
  let oauthService: OAuthService;
  let adapter: ReturnType<typeof createInMemoryAdapter>;

  beforeEach(() => {
    adapter = createInMemoryAdapter();
    oauthService = new OAuthService(adapter.oauth);
  });

  it("should register a new client application", async () => {
    const userId = crypto.randomUUID();
    const client = await oauthService.registerClient("My App", ["http://localhost:8000/callback"], ["authorization_code"], userId);

    expect(client).toBeDefined();
    expect(client.name).toBe("My App");
    expect(client.clientId).toBeDefined();
    expect(client.clientSecret).toBeDefined();
    expect(client.redirectUris).toContain("http://localhost:8000/callback");
  });

  it("should validate authorization requests and exchange authorization codes with PKCE S256 challenge", async () => {
    const userId = crypto.randomUUID();
    const client = await oauthService.registerClient("My App", ["http://localhost:8000/callback"], ["authorization_code"], userId);

    // Validate request
    await oauthService.validateAuthorizeRequest(client.clientId, "http://localhost:8000/callback", "code");

    // Create auth code
    // S256 challenge for verifier "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
    const challenge = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM";
    const code = await oauthService.createAuthorizationCode(
      client.clientId,
      userId,
      "http://localhost:8000/callback",
      challenge,
      "S256"
    );

    expect(code).toBeDefined();

    // Exchange code
    const tokens = await oauthService.exchangeCodeForToken(
      code,
      client.clientId,
      client.clientSecret,
      "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
    );

    expect(tokens).toBeDefined();
    expect(tokens.accessToken).toBeDefined();
    expect(tokens.refreshToken).toBeDefined();
  });
});
