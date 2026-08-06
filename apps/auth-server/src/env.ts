import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    PORT: z.string().transform((v) => parseInt(v, 10)).default("3005"),
    DATABASE_URL: z.string().url().default("postgres://postgres:postgres@localhost:5432/authgate"),
    ALLOWED_ORIGINS: z.string().default("http://localhost:5173"),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
