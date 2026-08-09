import { Hono } from "hono";

const app = new Hono();

// Mock store to persist verifier and token context during redirect roundtrip
let oauthStore = {
  codeVerifier: "",
  accessToken: "",
  refreshToken: "",
};

// Target AuthGate configurations
const CLIENT_ID = "2d048fbc3fa691553c5b42244c315406"; // Set this to the client ID registered in console
const CLIENT_SECRET = "77a1ccb0864869a4959340dd8e5642bc947160489491a609ce9e68b66827750f";
const AUTHGATE_URL = "http://localhost:3005";
const REDIRECT_URI = "http://localhost:3006/callback";

// Helper to calculate PKCE S256 challenge
async function generatePkceChallenge(verifier: string): Promise<string> {
  const verifierBuffer = Buffer.from(verifier, "utf-8");
  const hashBuffer = await crypto.subtle.digest("SHA-256", verifierBuffer);
  return Buffer.from(hashBuffer)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

app.get("/", (c) => {
  if (oauthStore.accessToken) {
    return c.html(`
      <html>
        <body style="font-family: sans-serif; background: #09090b; color: #fafafa; padding: 2rem;">
          <h1>OAuth 2.1 Client Dashboard</h1>
          <p style="color: #10b981;">✓ Successfully Authenticated via AuthGate!</p>
          <div style="background: #18181b; padding: 1.5rem; border-radius: 8px; border: 1px border #27272a;">
            <p><strong>Access Token:</strong></p>
            <code style="word-break: break-all; color: #a78bfa;">${oauthStore.accessToken}</code>
            <p><strong>Refresh Token:</strong></p>
            <code style="word-break: break-all; color: #c084fc;">${oauthStore.refreshToken}</code>
          </div>
          <p><a href="/logout" style="color: #ef4444;">Log Out</a></p>
        </body>
      </html>
    `);
  }

  return c.html(`
    <html>
      <body style="font-family: sans-serif; background: #09090b; color: #fafafa; text-align: center; padding-top: 10%;">
        <h1>Welcome to Demo Client App</h1>
        <p style="color: #a1a1aa;">This app simulates a third-party service integrating AuthGate OAuth 2.1</p>
        <p><a href="/login" style="display: inline-block; background: #3b82f6; color: white; padding: 0.75rem 2rem; border-radius: 6px; text-decoration: none; font-weight: bold;">Login with AuthGate</a></p>
      </body>
    </html>
  `);
});

app.get("/login", async (c) => {
  // Generate PKCE verifier and S256 challenge
  const codeVerifier = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const codeChallenge = await generatePkceChallenge(codeVerifier);

  oauthStore.codeVerifier = codeVerifier;

  // Redirect to AuthGate consent interface page
  // Note: Standard OAuth flow redirects user to AuthGate web interface to authenticate and click "Approve"
  const authorizeUrl = new URL(`${AUTHGATE_URL}/api/oauth/authorize`);
  authorizeUrl.searchParams.set("client_id", CLIENT_ID);
  authorizeUrl.searchParams.set("redirect_uri", REDIRECT_URI);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("code_challenge", codeChallenge);
  authorizeUrl.searchParams.set("code_challenge_method", "S256");

  // In production, the user is redirected to the AuthGate UI to log in and approve.
  // We direct the user to the consent screen URL
  return c.redirect(authorizeUrl.toString());
});

app.get("/callback", async (c) => {
  const code = c.req.query("code");
  if (!code) {
    return c.text("Authorization failed: code parameter missing in callback redirect.", 400);
  }

  try {
    // Swap authorization code for tokens using POST /api/oauth/token
    const res = await fetch(`${AUTHGATE_URL}/api/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code_verifier: oauthStore.codeVerifier,
      }),
    });

    const data: any = await res.json();
    if (!res.ok) {
      return c.text(`Token exchange failed: ${data.error?.message || "Unknown error"}`, 400);
    }

    // Persist token session context
    oauthStore.accessToken = data.access_token;
    oauthStore.refreshToken = data.refresh_token;

    return c.redirect("/");
  } catch (e: any) {
    return c.text(`Network connection error: ${e.message}`, 500);
  }
});

app.get("/logout", (c) => {
  oauthStore = {
    codeVerifier: "",
    accessToken: "",
    refreshToken: "",
  };
  return c.redirect("/");
});

export default {
  port: 3006,
  fetch: app.fetch,
};
