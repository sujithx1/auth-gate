import { Hono } from "hono";
import { z } from "zod";
import { OAuthService } from "@authgate/oauth";
import { Env, AuthGateServerConfig } from "../types";

const clientRegisterSchema = z.object({
  name: z.string().min(1),
  redirectUris: z.array(z.string().url()).min(1),
  allowedGrantTypes: z.array(z.string()).default(["authorization_code", "refresh_token"]),
});

const approveSchema = z.object({
  clientId: z.string(),
  redirectUri: z.string().url(),
  codeChallenge: z.string(),
  codeChallengeMethod: z.enum(["plain", "S256"]),
  scope: z.string().optional(),
});

const tokenExchangeSchema = z.object({
  grant_type: z.enum(["authorization_code", "refresh_token"]),
  code: z.string().optional(),
  client_id: z.string(),
  client_secret: z.string().optional(),
  code_verifier: z.string().optional(),
  refresh_token: z.string().optional(),
});

export function createOAuthRouter(
  oauthService: OAuthService,
  authMiddleware: any
,
  config: AuthGateServerConfig
) {
  const router = new Hono<Env>();

  /**
   * Register Client application (Secure - Developer Console).
   */
  router.post("/clients", authMiddleware, async (c) => {
    const body = await c.req.json();
    const parsed = clientRegisterSchema.parse(body);
    const user = c.get("user");

    const client = await oauthService.registerClient(
      parsed.name,
      parsed.redirectUris,
      parsed.allowedGrantTypes,
      user.id
    );

    return c.json({
      success: true,
      data: { client },
    }, 201);
  });

  /**
   * List developer client applications.
   */
  router.get("/clients", authMiddleware, async (c) => {
    const user = c.get("user");
    const clients = await oauthService.getUserClients(user.id);

    return c.json({
      success: true,
      data: { clients },
    });
  });

  /**
   * Validate Authorization consent parameters.
   */
  router.get("/authorize", authMiddleware, async (c) => {
    const clientId = c.req.query("client_id");
    const redirectUri = c.req.query("redirect_uri");
    const responseType = c.req.query("response_type");

    if (!clientId || !redirectUri || !responseType) {
      return c.json({
        success: false,
        error: {
          code: "BAD_REQUEST",
          message: "Missing query parameters: client_id, redirect_uri, and response_type are required.",
        },
      }, 400);
    }

    const client = await oauthService.validateAuthorizeRequest(clientId, redirectUri, responseType);

    return c.json({
      success: true,
      data: {
        client: {
          name: client.name,
          clientId: client.clientId,
          redirectUri,
        },
      },
    });
  });

  /**
   * Approve Authorization Consent and issue Authorization Code.
   */
  router.post("/authorize", authMiddleware, async (c) => {
    const body = await c.req.json();
    const parsed = approveSchema.parse(body);
    const user = c.get("user");

    // Re-verify request parameters
    await oauthService.validateAuthorizeRequest(parsed.clientId, parsed.redirectUri, "code");

    // Generate authorization code
    const code = await oauthService.createAuthorizationCode(
      parsed.clientId,
      user.id,
      parsed.redirectUri,
      parsed.codeChallenge,
      parsed.codeChallengeMethod,
      parsed.scope
    );

    const redirectUrl = new URL(parsed.redirectUri);
    redirectUrl.searchParams.set("code", code);

    return c.json({
      success: true,
      data: {
        redirectUrl: redirectUrl.toString(),
      },
    });
  });

  /**
   * Exchange Code / Refresh Token for Access Tokens.
   */
  router.post("/token", async (c) => {
    // Parse form-urlencoded (as per standard OAuth specification) or fallback to JSON
    let body: any;
    const contentType = c.req.header("content-type") || "";
    if (contentType.includes("application/x-www-form-urlencoded")) {
      body = await c.req.parseBody();
    } else {
      body = await c.req.json();
    }

    const parsed = tokenExchangeSchema.parse(body);

    if (parsed.grant_type === "authorization_code") {
      if (!parsed.code || !parsed.code_verifier) {
        return c.json({
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "Missing code or code_verifier parameters.",
          },
        }, 400);
      }

      const token = await oauthService.exchangeCodeForToken(
        parsed.code,
        parsed.client_id,
        parsed.client_secret,
        parsed.code_verifier
      );

      const url = new URL(c.req.url);
      const idToken = token.scope?.includes("openid")
        ? oauthService.generateIdToken({ id: token.userId, email: `user_${token.userId.substring(0, 6)}@example.com` }, parsed.client_id, url.origin)
        : undefined;

      return c.json({
        access_token: token.accessToken,
        token_type: "Bearer",
        expires_in: 3600,
        refresh_token: token.refreshToken,
        scope: token.scope,
        ...(idToken ? { id_token: idToken } : {}),
      });
    }

    if (parsed.grant_type === "refresh_token") {
      if (!parsed.refresh_token) {
        return c.json({
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "Missing refresh_token parameter.",
          },
        }, 400);
      }

      const token = await oauthService.exchangeRefreshTokenForToken(
        parsed.refresh_token,
        parsed.client_id,
        parsed.client_secret
      );

      const url = new URL(c.req.url);
      const idToken = token.scope?.includes("openid")
        ? oauthService.generateIdToken({ id: token.userId, email: `user_${token.userId.substring(0, 6)}@example.com` }, parsed.client_id, url.origin)
        : undefined;

      return c.json({
        access_token: token.accessToken,
        token_type: "Bearer",
        expires_in: 3600,
        refresh_token: token.refreshToken,
        scope: token.scope,
        ...(idToken ? { id_token: idToken } : {}),
      });
    }

    return c.json({
      success: false,
      error: {
        code: "UNSUPPORTED_GRANT_TYPE",
        message: "The requested grant type is not supported.",
      },
    }, 400);
  });

  /**
   * OIDC UserInfo Endpoint.
   */
  router.get("/userinfo", authMiddleware, async (c) => {
    const user = c.get("user");
    return c.json({
      sub: user.id,
      email: user.email,
      email_verified: user.isEmailVerified ?? true,
      name: (user as any).name || user.email.split("@")[0],
    });
  });

  return router;
}
