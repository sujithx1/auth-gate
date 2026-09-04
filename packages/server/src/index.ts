import { Hono } from "hono";
import { AuthGateServerConfig, Env } from "./types";
import { AuthService } from "@authgate/auth";
import { SessionService } from "@authgate/session";
import { RbacService } from "@authgate/rbac";
import { OrganizationService } from "@authgate/organization";
import { OAuthService } from "@authgate/oauth";

import { createAuthMiddleware, createPermissionMiddleware } from "./middleware/auth";
import { createAuthRouter } from "./routes/auth";
import { createOrganizationRouter } from "./routes/organization";
import { createRbacRouter } from "./routes/rbac";
import { createOAuthRouter } from "./routes/oauth";

export * from "./types";

export function createAuthGateServer(config: AuthGateServerConfig) {
  const authService = new AuthService(
    config.database.users,
    config.database.verificationTokens,
    config.database.twoFactor,
    config.database.otpCodes,
    config.database.socialAccounts
  );
  const sessionService = new SessionService(config.database.sessions);
  const rbacService = new RbacService(config.database.roles);
  const orgService = new OrganizationService(config.database.organizations, config.database.invitations);
  const oauthService = new OAuthService(config.database.oauth);

  const authMiddleware = createAuthMiddleware(config.database.users, sessionService);
  const permissionMiddleware = createPermissionMiddleware(rbacService);

  const authRouter = createAuthRouter(authService, sessionService, authMiddleware, config);
  const orgRouter = createOrganizationRouter(orgService, authMiddleware, config);
  const rbacRouter = createRbacRouter(rbacService, authMiddleware, permissionMiddleware, config);
  const oauthRouter = createOAuthRouter(oauthService, authMiddleware, config);

  const app = new Hono<Env>();

  app.get("/.well-known/openid-configuration", (c) => {
    const url = new URL(c.req.url);
    const origin = config.publicUrl || url.origin;
    return c.json(oauthService.getDiscoveryDoc(origin));
  });

  app.get("/.well-known/jwks.json", (c) => {
    return c.json(oauthService.getJwks());
  });

  app.route("/auth", authRouter);
  app.route("/orgs", orgRouter);
  app.route("/rbac", rbacRouter);
  app.route("/oauth", oauthRouter);

  return app;
}
