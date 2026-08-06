import { Hono } from "hono";
import { cors } from "hono/cors";
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
import { createAuthMiddleware } from "./middleware/auth";
import { createAuthRouter } from "./routes/auth";

// 1. Initialize DB Connection & Adapter
const queryClient = postgres(env.DATABASE_URL);
const db = drizzle(queryClient);
const adapter = drizzleAdapter(db);

const authGate = createAuthGate({ database: adapter });
const authService = new AuthService(authGate.database.users, authGate.database.verificationTokens);
const sessionService = new SessionService(authGate.database.sessions);

// 2. Initialize Hono App
const app = new Hono<Env>();

// Configure CORS using T3 Env origins
app.use("*", cors({
  origin: env.ALLOWED_ORIGINS.split(","),
  credentials: true,
}));

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
const authMiddleware = createAuthMiddleware(authGate.database.users, sessionService);
const authRouter = createAuthRouter(authService, sessionService, authMiddleware);

app.route("/api/auth", authRouter);

export default {
  port: env.PORT,
  fetch: app.fetch,
};
export { app };
