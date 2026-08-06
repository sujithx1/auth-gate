import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./packages/adapters/drizzle/src/schema.ts",
  out: "./packages/adapters/drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/authgate",
  },
});
