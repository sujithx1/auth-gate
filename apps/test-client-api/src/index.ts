import { Hono } from "hono";
import { cors } from "hono/cors";
import { AuthGateClient } from "@sujithx/authgate";
import { createAuthGateServer } from "@authgate/server";
import { drizzleAdapter } from "@authgate/drizzle";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// 1. Client connects to their own database
const queryClient = postgres(process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/authgate");
const db = drizzle(queryClient);

// 2. Client initializes the AuthGate SDK
const authGateApp = createAuthGateServer({
  database: drizzleAdapter(db),
  allowedOrigins: ["http://localhost:5174", "http://localhost:5173", "http://localhost:5175"],
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax"
  },
  publicUrl: process.env.AUTHGATE_URL || "http://localhost:3004"
});

const app = new Hono();

// Configure CORS so the UI client can call it
app.use("/*", cors({
  origin: ["http://localhost:5174", "http://localhost:5173", "http://localhost:5175"],
  credentials: true,
}));

// 3. Client mounts the AuthGate SDK routes onto their own API!
// Now the frontend can hit http://localhost:3004/api/auth/login
app.route("/api", authGateApp);

// Initialize the AuthGate SDK to verify tokens
const authClient = new AuthGateClient({
  baseUrl: process.env.AUTHGATE_URL || "http://localhost:3004",
});

app.get("/", (c) => c.json({ status: "API is running" }));

// Protected route that checks the user's AuthGate session via the SDK
app.get("/api/protected", async (c) => {
  try {
    const cookieHeader = c.req.header("Cookie");
    if (!cookieHeader) {
      return c.json({ error: "Unauthorized", message: "No session cookie found" }, 401);
    }
    
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
  port: process.env.PORT ? parseInt(process.env.PORT) : 3004,
  fetch: app.fetch,
};
