import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { z } from "zod";

import { createAuthGate } from "@authgate/core";
import { drizzleAdapter } from "@authgate/drizzle";
import { AuthService } from "@authgate/auth";
import { SessionService } from "@authgate/session";
import { AuthGateError } from "@authgate/shared";

import { env } from "./env";
import { Env } from "./types";
import { createAuthMiddleware, createPermissionMiddleware } from "./middleware/auth";
import { createAuthRouter } from "./routes/auth";
import { createOrganizationRouter } from "./routes/organization";
import { createRbacRouter } from "./routes/rbac";
import { createOAuthRouter } from "./routes/oauth";
import { RbacService } from "@authgate/rbac";
import { OrganizationService } from "@authgate/organization";
import { OAuthService } from "@authgate/oauth";

// 1. Initialize DB Connection & Adapter
const queryClient = postgres(env.DATABASE_URL);
const db = drizzle(queryClient);
const adapter = drizzleAdapter(db);

const authGate = createAuthGate({ database: adapter });
const authService = new AuthService(
  authGate.database.users,
  authGate.database.verificationTokens,
  authGate.database.twoFactor,
  authGate.database.otpCodes,
  authGate.database.socialAccounts
);
const sessionService = new SessionService(authGate.database.sessions);

// 2. Initialize Hono App
const app = new Hono<Env>();

app.use("*", cors({
  origin: ["http://localhost:5173", "http://localhost:5174"],
  allowHeaders: ["Authorization", "Content-Type", "Cookie"],
  exposeHeaders: ["Content-Length"],
  credentials: true,
}));
app.use("*", logger());
// Global Error Handler conforming to API Rules
app.onError((err, c) => {
  console.error("Request Error:", err);
  if (err instanceof AuthGateError) {
    return c.json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    }, err.statusCode as any);
  }

  if (err instanceof z.ZodError) {
    return c.json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request payload",
        details: err.flatten(),
      },
    }, 400);
  }

  return c.json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: err.message || "An unexpected error occurred",
    },
  }, 500);
});

// 3. Setup Routes and Middleware
const rbacService = new RbacService(authGate.database.roles);
const orgService = new OrganizationService(authGate.database.organizations, authGate.database.invitations);
const oauthService = new OAuthService(authGate.database.oauth);

const authMiddleware = createAuthMiddleware(authGate.database.users, sessionService);
const permissionMiddleware = createPermissionMiddleware(rbacService);

const authRouter = createAuthRouter(authService, sessionService, authMiddleware);
const orgRouter = createOrganizationRouter(orgService, authMiddleware);
const rbacRouter = createRbacRouter(rbacService, authMiddleware, permissionMiddleware);
const oauthRouter = createOAuthRouter(oauthService, authMiddleware);

app.route("/api/auth", authRouter);
app.route("/api/orgs", orgRouter);
app.route("/api/rbac", rbacRouter);
app.route("/api/oauth", oauthRouter);

export default {
  port: env.PORT,
  fetch: app.fetch,
};
export { app };
