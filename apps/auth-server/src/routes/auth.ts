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

    try {
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
    } catch (err: any) {
      if (err.code === "TWO_FACTOR_REQUIRED") {
        return c.json({
          success: true,
          twoFactorRequired: true,
          userId: err.details.userId,
        });
      }
      throw err;
    }
  });

  /**
   * Login second step: verify 2FA code or backup code.
   */
  router.post("/login/verify-2fa", async (c) => {
    const body = await c.req.json();
    const parsed = z.object({ userId: z.string(), code: z.string() }).parse(body);

    const user = await authService.loginWithTwoFactor(parsed.userId, parsed.code);

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
   * Enable 2FA TOTP secret.
   */
  router.post("/2fa/enable", authMiddleware, async (c) => {
    const user = c.get("user");
    const { secret, uri } = await authService.enableTwoFactor(user.id);
    return c.json({ success: true, secret, uri });
  });

  /**
   * Verify and activate 2FA TOTP secret.
   */
  router.post("/2fa/verify", authMiddleware, async (c) => {
    const user = c.get("user");
    const body = await c.req.json();
    const parsed = z.object({ code: z.string() }).parse(body);
    const { backupCodes } = await authService.verifyTwoFactor(user.id, parsed.code);
    return c.json({ success: true, backupCodes });
  });

  /**
   * Disable 2FA.
   */
  router.post("/2fa/disable", authMiddleware, async (c) => {
    const user = c.get("user");
    const body = await c.req.json();
    const parsed = z.object({ code: z.string() }).parse(body);
    await authService.disableTwoFactor(user.id, parsed.code);
    return c.json({ success: true });
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
    const mfa = await authService.getTwoFactorStatus(user.id);
    return c.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          isEmailVerified: user.isEmailVerified,
          createdAt: user.createdAt,
          is2faActive: !!(mfa && mfa.isActive),
        },
      },
    });
  });

  /**
   * Generate OTP verification code mediator endpoint.
   */
  router.post("/otp/generate", async (c) => {
    const body = await c.req.json();
    const parsed = z.object({
      identifier: z.string(),
      length: z.number().min(4).max(8).optional(),
      expiresSeconds: z.number().optional(),
    }).parse(body);

    const { code } = await authService.generateOtp(parsed.identifier, parsed.length, parsed.expiresSeconds);
    return c.json({ success: true, code });
  });

  /**
   * Verify OTP code and issue session token endpoint.
   */
  router.post("/otp/verify", async (c) => {
    const body = await c.req.json();
    const parsed = z.object({
      identifier: z.string(),
      code: z.string(),
    }).parse(body);

    const user = await authService.verifyOtp(parsed.identifier, parsed.code);

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
   * List all active sessions for currently logged-in user.
   */
  router.get("/sessions", authMiddleware, async (c) => {
    const user = c.get("user");
    const active = await sessionService.getUserSessions(user.id);
    const currentToken = getCookie(c, "authgate_session");

    return c.json({
      success: true,
      data: active.map((s) => ({
        id: s.id,
        userAgent: s.userAgent || "Unknown Device",
        ipAddress: s.ipAddress || "Unknown IP",
        expiresAt: s.expiresAt,
        isCurrent: s.token === currentToken,
      })),
    });
  });

  /**
   * Revoke a targeted active session.
   */
  router.delete("/sessions/:id", authMiddleware, async (c) => {
    const user = c.get("user");
    const id = c.req.param("id");
    await sessionService.revokeSession(id, user.id);
    return c.json({ success: true });
  });

  /**
   * Google Redirection route
   */
  router.get("/social/google", (c) => {
    if (!env.GOOGLE_CLIENT_ID) {
      return c.redirect("/api/auth/social/mock-consent?provider=google");
    }
    const redirectUri = `${c.req.url}/callback`;
    console.log("env.GOOGLE_CLIENT_ID", env.GOOGLE_CLIENT_ID)
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20profile%20email&state=google-state`;
    return c.redirect(googleAuthUrl);
  });

  /**
   * Google Callback route
   */
  router.get("/social/google/callback", async (c) => {
    const code = c.req.query("code");
    if (!code) return c.text("Authorization code missing.", 400);

    const redirectUri = c.req.url.split("?")[0];

    // Exchange token
    const payload = {
      code,
      client_id: env.GOOGLE_CLIENT_ID || "",
      client_secret: env.GOOGLE_CLIENT_SECRET || "",
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    };
    console.log("Exchanging Google OAuth token with payload:", { ...payload, client_secret: payload.client_secret ? "***[PROVIDED]***" : "***[MISSING]***" });

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(payload),
    });

    const tokens: any = await tokenRes.json();
    if (!tokens.access_token) {
      console.error("Google OAuth token exchange failed:", tokens);
      return c.text("Failed to exchange google oauth token.", 400);
    }

    // Get user info
    const infoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const info: any = await infoRes.json();

    if (!info.email || !info.sub) {
      return c.text("Google profile missing email or sub credentials.", 400);
    }

    const user = await authService.loginOrRegisterWithSocial("google", info.sub, info.email);

    // Create session & cookies
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

    const targetOrigin = env.ALLOWED_ORIGINS?.split(",")[0]?.trim() || "http://localhost:5173";
    return c.redirect(targetOrigin);
  });

  /**
   * GitHub Redirection route
   */
  router.get("/social/github", (c) => {
    if (!env.GITHUB_CLIENT_ID) {
      return c.redirect("/api/auth/social/mock-consent?provider=github");
    }
    const redirectUri = `${c.req.url}/callback`;
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${env.GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email&state=github-state`;
    return c.redirect(githubAuthUrl);
  });

  /**
   * GitHub Callback route
   */
  router.get("/social/github/callback", async (c) => {
    const code = c.req.query("code");
    if (!code) return c.text("Authorization code missing.", 400);

    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID || "",
        client_secret: env.GITHUB_CLIENT_SECRET || "",
        code,
      }),
    });

    const tokens: any = await tokenRes.json();
    if (!tokens.access_token) {
      return c.text("Failed to exchange github oauth token.", 400);
    }

    // Get GitHub Profile
    const profileRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        "User-Agent": "AuthGate-Server",
      },
    });
    const profile: any = await profileRes.json();

    // Get GitHub Emails (to fetch primary verified email)
    const emailsRes = await fetch("https://api.github.com/user/emails", {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        "User-Agent": "AuthGate-Server",
      },
    });
    const emails: any[] = await emailsRes.json();

    const primaryEmail = emails.find((e) => e.primary && e.verified)?.email || profile.email;
    if (!primaryEmail || !profile.id) {
      return c.text("GitHub profile missing email or ID credentials.", 400);
    }

    const user = await authService.loginOrRegisterWithSocial("github", String(profile.id), primaryEmail);

    // Create session & cookies
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

    const targetOrigin = env.ALLOWED_ORIGINS?.split(",")[0]?.trim() || "http://localhost:5173";
    return c.redirect(targetOrigin);
  });

  /**
   * Built-in Mock Consent Form for Local E2E testing
   */
  router.get("/social/mock-consent", (c) => {
    const provider = c.req.query("provider") || "google";
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>AuthGate Social Sign-In (Mock Mode)</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          body {
            background-color: #030712;
            color: #f9fafb;
            font-family: 'Plus Jakarta Sans', sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
          }
          .card {
            background: #111827;
            border: 1px solid #1f2937;
            padding: 2.5rem;
            border-radius: 1rem;
            width: 100%;
            max-width: 400px;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
          }
          h2 {
            margin-top: 0;
            font-size: 1.5rem;
            font-weight: 700;
          }
          p {
            color: #9ca3af;
            font-size: 0.875rem;
            margin-bottom: 1.5rem;
          }
          label {
            display: block;
            font-size: 0.75rem;
            font-weight: 600;
            color: #9ca3af;
            margin-bottom: 0.5rem;
          }
          input {
            width: 100%;
            padding: 0.75rem;
            background: #1f2937;
            border: 1px solid #374151;
            color: white;
            border-radius: 0.5rem;
            box-sizing: border-box;
            margin-bottom: 1.5rem;
            font-size: 0.875rem;
          }
          button {
            width: 100%;
            padding: 0.75rem;
            background: #4f46e5;
            color: white;
            border: none;
            border-radius: 0.5rem;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s;
            font-size: 0.875rem;
          }
          button:hover {
            background: #4338ca;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>Mock ${provider.charAt(0).toUpperCase() + provider.slice(1)} Login</h2>
          <p>You are using AuthGate in development mode. Simulate a third-party social authentication response below.</p>
          <form action="/api/auth/social/mock/callback" method="GET">
            <input type="hidden" name="provider" value="${provider}">
            <label>Email Address</label>
            <input type="email" name="email" value="mockuser@example.com" required>
            <label>User ID</label>
            <input type="text" name="id" value="mock-social-id-${Math.floor(Math.random() * 1000)}" required>
            <button type="submit">Authorise Mock Account</button>
          </form>
        </div>
      </body>
      </html>
    `;
    return c.html(html);
  });

  /**
   * Mock callback resolver
   */
  router.get("/social/mock/callback", async (c) => {
    const provider = c.req.query("provider") || "google";
    const email = c.req.query("email") || "mockuser@example.com";
    const id = c.req.query("id") || "mock-id-123";

    const user = await authService.loginOrRegisterWithSocial(provider, id, email);

    // Create session & cookies
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

    return c.redirect(env.ALLOWED_ORIGINS || "http://localhost:5173");
  });

  return router;
}
