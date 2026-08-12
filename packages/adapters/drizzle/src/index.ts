import { DatabaseAdapter } from "@authgate/core";
import {
  DrizzleUserRepository,
  DrizzleSessionRepository,
  DrizzleVerificationTokenRepository,
  DrizzleRoleRepository,
  DrizzleOrganizationRepository,
  DrizzleInvitationRepository,
  DrizzleOAuthRepository,
  DrizzleTwoFactorRepository,
  DrizzleOtpRepository,
  DrizzleSocialAccountRepository,
} from "./repositories";
import * as schema from "./schema";

export * from "./schema";
export * from "./repositories";

export function drizzleAdapter(db: any): DatabaseAdapter {
  return {
    users: new DrizzleUserRepository(db),
    sessions: new DrizzleSessionRepository(db),
    verificationTokens: new DrizzleVerificationTokenRepository(db),
    roles: new DrizzleRoleRepository(db),
    organizations: new DrizzleOrganizationRepository(db),
    invitations: new DrizzleInvitationRepository(db),
    oauth: new DrizzleOAuthRepository(db),
    twoFactor: new DrizzleTwoFactorRepository(db),
    otpCodes: new DrizzleOtpRepository(db),
    socialAccounts: new DrizzleSocialAccountRepository(db),
  };
}
