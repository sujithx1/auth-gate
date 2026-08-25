import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    PORT: z.string().transform((v) => parseInt(v, 10)).default("3005"),
    DATABASE_URL: z.string().url(),
    ALLOWED_ORIGINS: z.string().default("http://localhost:5173"),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
