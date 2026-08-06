import { Hono, Context } from "hono";
import { cors } from "hono/cors";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { z } from "zod";

import { createAuthGate, User, Session } from "@authgate/core";
import { drizzleAdapter } from "@authgate/drizzle";
import { AuthService } from "@authgate/auth";
import { SessionService } from "@authgate/session";
import { AuthGateError } from "@authgate/shared";
import { env } from "./env";

type Env = {
  Variables: {
    user: User;
    session: Session;
  };
};

// 1. Initialize DB Connection & Adapter
const databaseUrl = env.DATABASE_URL;
const queryClient = postgres(databaseUrl);
const db = drizzle(queryClient);
const adapter = drizzleAdapter(db);

const authGate = createAuthGate({ database: adapter });
const authService = new AuthService(authGate.database.users, authGate.database.verificationTokens);
const sessionService = new SessionService(authGate.database.sessions);

// 2. Initialize Hono App with type variables
const app = new Hono<Env>();

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

// Middleware to authenticate requests via session token in cookies
const authMiddleware = async (c: Context<Env>, next: () => Promise<void>) => {
  const token = getCookie(c, "authgate_session");
  if (!token) {
    throw new AuthGateError("UNAUTHORIZED", "No active session found", 401);
  }

  const session = await sessionService.validateSession(token);
  if (!session) {
    deleteCookie(c, "authgate_session");
    throw new AuthGateError("UNAUTHORIZED", "Session has expired or is invalid", 401);
  }

  const user = await authGate.database.users.findById(session.userId);
  if (!user) {
    deleteCookie(c, "authgate_session");
    throw new AuthGateError("UNAUTHORIZED", "User no longer exists", 401);
  }

  c.set("user", user);
  c.set("session", session);
  await next();
};

// 3. Validation Schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const verifyEmailSchema = z.object({
  token: z.string(),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(8),
});

// 4. Routes

/**
 * Register endpoint.
 */
app.post("/api/auth/register", async (c) => {
  const body = await c.req.json();
  const parsed = registerSchema.parse(body);

  const { user, verificationToken } = await authService.register(parsed.email, parsed.password);

  // In production, send this via email. We return it here for testing and visibility.
  return c.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
      },
      verificationToken,
    },
  }, 201);
});

/**
 * Login endpoint.
 */
app.post("/api/auth/login", async (c) => {
  const body = await c.req.json();
  const parsed = loginSchema.parse(body);

  const user = await authService.login(parsed.email, parsed.password);
  
  const userAgent = c.req.header("user-agent");
  const ipAddress = c.req.header("x-forwarded-for") || "127.0.0.1";

  const session = await sessionService.createSession(user.id, userAgent, ipAddress);

  setCookie(c, "authgate_session", session.token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "Lax",
    expires: session.expiresAt,
    path: "/",
  });

  return c.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
      },
    },
  });
});

/**
 * Logout endpoint.
 */
app.post("/api/auth/logout", async (c) => {
  const token = getCookie(c, "authgate_session");
  if (token) {
    await sessionService.invalidateSession(token);
  }
  deleteCookie(c, "authgate_session", { path: "/" });

  return c.json({
    success: true,
    data: {},
  });
});

/**
 * Verify Email endpoint.
 */
app.post("/api/auth/verify-email", async (c) => {
  const body = await c.req.json();
  const parsed = verifyEmailSchema.parse(body);

  const user = await authService.verifyEmail(parsed.token);

  return c.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
      },
    },
  });
});

/**
 * Forgot Password endpoint.
 */
app.post("/api/auth/forgot-password", async (c) => {
  const body = await c.req.json();
  const parsed = forgotPasswordSchema.parse(body);

  const token = await authService.forgotPassword(parsed.email);

  // In production, send this via email. We return it here for testing and visibility.
  return c.json({
    success: true,
    data: {
      resetToken: token,
    },
  });
});

/**
 * Reset Password endpoint.
 */
app.post("/api/auth/reset-password", async (c) => {
  const body = await c.req.json();
  const parsed = resetPasswordSchema.parse(body);

  await authService.resetPassword(parsed.token, parsed.newPassword);

  return c.json({
    success: true,
    data: {},
  });
});

/**
 * Get currently authenticated user endpoint.
 */
app.get("/api/auth/me", authMiddleware, async (c) => {
  const user = c.get("user");
  return c.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
      },
    },
  });
});

export default {
  port: env.PORT,
  fetch: app.fetch,
};
export { app };
