import { DatabaseAdapter } from "./domain/repositories";
export * from "./domain/entities";
export * from "./domain/repositories";
export * from "./testing/in-memory-repositories";
export * from "@authgate/shared";
export interface AuthGateOptions {
  database: DatabaseAdapter;
}
export function createAuthGate(options: AuthGateOptions) {
  return {
    database: options.database,
  };
}

