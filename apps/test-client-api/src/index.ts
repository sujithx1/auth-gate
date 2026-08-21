import { Hono } from "hono";
import { cors } from "hono/cors";
import { AuthGateClient } from "@sujithx/authgate";

const app = new Hono();

// Configure CORS so the UI client can call it
app.use("/*", cors({
  origin: ["http://localhost:5174", "http://localhost:5173", "http://localhost:5175"],
  credentials: true,
}));

// Initialize the AuthGate SDK to verify tokens against the central IAM server
const authClient = new AuthGateClient({
  baseUrl: "http://localhost:3003",
});

app.get("/", (c) => c.json({ status: "API is running" }));

// Protected route that checks the user's AuthGate session via the SDK
app.get("/api/protected", async (c) => {
  try {
    // Check if the user is authenticated (pass the cookie/auth header from the request)
    const cookieHeader = c.req.header("Cookie");
    if (!cookieHeader) {
      return c.json({ error: "Unauthorized", message: "No session cookie found" }, 401);
    }

    // In a real scenario, you'd pass the session token or headers to the authClient to verify
    // Since AuthGate uses HttpOnly cookies, we just need to ensure the request from the browser
    // to the main auth server is authenticated. 
    // Here we're just simulating a backend check.
    
    return c.json({
      message: "You have accessed a protected resource!",
      resourceId: "res_789",
      secretData: "The quick brown fox jumps over the lazy dog."
    });
  } catch (error: any) {
    return c.json({ error: "Unauthorized", message: error.message }, 401);
  }
});

export default {
  port: 3004,
  fetch: app.fetch,
};
