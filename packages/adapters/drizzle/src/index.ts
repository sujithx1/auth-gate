import { DatabaseAdapter } from "@authgate/core";
import {
  DrizzleUserRepository,
  DrizzleSessionRepository,
  DrizzleVerificationTokenRepository,
} from "./repositories";
import * as schema from "./schema";

export * from "./schema";
export * from "./repositories";

export function drizzleAdapter(db: any): DatabaseAdapter {
  return {
    users: new DrizzleUserRepository(db),
    sessions: new DrizzleSessionRepository(db),
    verificationTokens: new DrizzleVerificationTokenRepository(db),
  };
}
