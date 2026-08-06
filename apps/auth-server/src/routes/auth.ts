import { Hono } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { z } from "zod";
import { AuthService } from "@authgate/auth";
import { SessionService } from "@authgate/session";
import { Env } from "../types";
import { env } from "../env";

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

export function createAuthRouter(
  authService: AuthService,
  sessionService: SessionService,
  authMiddleware: any
) {
  const router = new Hono<Env>();

  /**
   * Register endpoint.
   */
  router.post("/register", async (c) => {
    const body = await c.req.json();
    const parsed = registerSchema.parse(body);

    const { user, verificationToken } = await authService.register(parsed.email, parsed.password);

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
  router.post("/login", async (c) => {
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
  router.post("/logout", async (c) => {
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
  router.post("/verify-email", async (c) => {
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
  router.post("/forgot-password", async (c) => {
    const body = await c.req.json();
    const parsed = forgotPasswordSchema.parse(body);

    const token = await authService.forgotPassword(parsed.email);

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
  router.post("/reset-password", async (c) => {
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
  router.get("/me", authMiddleware, async (c) => {
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

  return router;
}
