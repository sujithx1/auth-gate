import { eq, and, lt } from "drizzle-orm";
import {
  User,
  UserRepository,
  Session,
  SessionRepository,
  VerificationToken,
  VerificationTokenRepository,
  VerificationTokenType,
  Role,
  Permission,
  RoleRepository,
  Organization,
  OrganizationMember,
  Invitation,
  OrganizationRepository,
  InvitationRepository,
  OAuthClient,
  OAuthAuthorizationCode,
  OAuthToken,
  OAuthRepository,
} from "@authgate/core";
import * as schema from "./schema";

export class DrizzleUserRepository implements UserRepository {
  constructor(private readonly db: any) {}

  async findById(id: string): Promise<User | null> {
    const results = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, id))
      .limit(1);
    return results[0] || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const results = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);
    return results[0] || null;
  }

  async create(user: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User> {
    const results = await this.db
      .insert(schema.users)
      .values({
        email: user.email,
        passwordHash: user.passwordHash,
        isEmailVerified: user.isEmailVerified,
      })
      .returning();
    return results[0];
  }

  async update(
    id: string,
    user: Partial<Omit<User, "id" | "createdAt" | "updatedAt">>
  ): Promise<User> {
    const results = await this.db
      .update(schema.users)
      .set({
        ...user,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, id))
      .returning();
    return results[0];
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(schema.users).where(eq(schema.users.id, id));
  }
}

export class DrizzleSessionRepository implements SessionRepository {
  constructor(private readonly db: any) {}

  async findById(id: string): Promise<Session | null> {
    const results = await this.db
      .select()
      .from(schema.sessions)
      .where(eq(schema.sessions.id, id))
      .limit(1);
    return results[0] || null;
  }

  async findByToken(token: string): Promise<Session | null> {
    const results = await this.db
      .select()
      .from(schema.sessions)
      .where(eq(schema.sessions.token, token))
      .limit(1);
    return results[0] || null;
  }

  async create(session: Omit<Session, "id" | "createdAt">): Promise<Session> {
    const results = await this.db
      .insert(schema.sessions)
      .values({
        userId: session.userId,
        token: session.token,
        expiresAt: session.expiresAt,
        userAgent: session.userAgent,
        ipAddress: session.ipAddress,
      })
      .returning();
    return results[0];
  }

  async deleteByToken(token: string): Promise<void> {
    await this.db.delete(schema.sessions).where(eq(schema.sessions.token, token));
  }

  async deleteExpired(): Promise<void> {
    await this.db.delete(schema.sessions).where(lt(schema.sessions.expiresAt, new Date()));
  }
}

export class DrizzleVerificationTokenRepository implements VerificationTokenRepository {
  constructor(private readonly db: any) {}

  async findByTokenAndType(
    token: string,
    type: VerificationTokenType
  ): Promise<VerificationToken | null> {
    const results = await this.db
      .select()
      .from(schema.verificationTokens)
      .where(
        and(
          eq(schema.verificationTokens.token, token),
          eq(schema.verificationTokens.type, type)
        )
      )
      .limit(1);
    const raw = results[0];
    if (!raw) return null;
    return {
      ...raw,
      type: raw.type as VerificationTokenType,
    };
  }

  async create(
    tokenData: Omit<VerificationToken, "id" | "createdAt">
  ): Promise<VerificationToken> {
    const results = await this.db
      .insert(schema.verificationTokens)
      .values({
        userId: tokenData.userId,
        token: tokenData.token,
        type: tokenData.type,
        expiresAt: tokenData.expiresAt,
      })
      .returning();
    const raw = results[0];
    return {
      ...raw,
      type: raw.type as VerificationTokenType,
    };
  }

  async deleteByTokenAndType(token: string, type: VerificationTokenType): Promise<void> {
    await this.db
      .delete(schema.verificationTokens)
      .where(
        and(
          eq(schema.verificationTokens.token, token),
          eq(schema.verificationTokens.type, type)
        )
      );
  }

  async deleteExpired(): Promise<void> {
    await this.db
      .delete(schema.verificationTokens)
      .where(lt(schema.verificationTokens.expiresAt, new Date()));
  }
}

export class DrizzleRoleRepository implements RoleRepository {
  constructor(private readonly db: any) {}

  async createRole(role: Omit<Role, "id" | "createdAt">): Promise<Role> {
    const results = await this.db.insert(schema.roles).values(role).returning();
    return results[0];
  }

  async createPermission(permission: Omit<Permission, "id" | "createdAt">): Promise<Permission> {
    const results = await this.db.insert(schema.permissions).values(permission).returning();
    return results[0];
  }

  async findRoleByName(name: string): Promise<Role | null> {
    const results = await this.db.select().from(schema.roles).where(eq(schema.roles.name, name)).limit(1);
    return results[0] || null;
  }

  async findPermissionByName(name: string): Promise<Permission | null> {
    const results = await this.db.select().from(schema.permissions).where(eq(schema.permissions.name, name)).limit(1);
    return results[0] || null;
  }

  async addPermissionToRole(roleId: string, permissionId: string): Promise<void> {
    await this.db.insert(schema.rolePermissions).values({ roleId, permissionId });
  }

  async assignRoleToUser(userId: string, roleId: string): Promise<void> {
    await this.db.insert(schema.userRoles).values({ userId, roleId });
  }

  async getUserPermissions(userId: string): Promise<Permission[]> {
    const userRoleList = await this.db
      .select({ roleId: schema.userRoles.roleId })
      .from(schema.userRoles)
      .where(eq(schema.userRoles.userId, userId));
    const roleIds = userRoleList.map((ur: any) => ur.roleId);
    if (roleIds.length === 0) return [];

    const permList = await this.db
      .select({
        id: schema.permissions.id,
        name: schema.permissions.name,
        description: schema.permissions.description,
        createdAt: schema.permissions.createdAt,
      })
      .from(schema.rolePermissions)
      .innerJoin(schema.permissions, eq(schema.rolePermissions.permissionId, schema.permissions.id))
      .where(eq(schema.rolePermissions.roleId, roleIds[0])); // simple match for first role or map them
    
    return permList;
  }

  async getUserRoles(userId: string): Promise<Role[]> {
    const list = await this.db
      .select({
        id: schema.roles.id,
        name: schema.roles.name,
        description: schema.roles.description,
        createdAt: schema.roles.createdAt,
      })
      .from(schema.userRoles)
      .innerJoin(schema.roles, eq(schema.userRoles.roleId, schema.roles.id))
      .where(eq(schema.userRoles.userId, userId));
    return list;
  }
}

export class DrizzleOrganizationRepository implements OrganizationRepository {
  constructor(private readonly db: any) {}

  async findById(id: string): Promise<Organization | null> {
    const results = await this.db.select().from(schema.organizations).where(eq(schema.organizations.id, id)).limit(1);
    return results[0] || null;
  }

  async findBySlug(slug: string): Promise<Organization | null> {
    const results = await this.db.select().from(schema.organizations).where(eq(schema.organizations.slug, slug)).limit(1);
    return results[0] || null;
  }

  async create(org: Omit<Organization, "id" | "createdAt" | "updatedAt">): Promise<Organization> {
    const results = await this.db.insert(schema.organizations).values(org).returning();
    return results[0];
  }

  async addMember(member: Omit<OrganizationMember, "id" | "createdAt">): Promise<OrganizationMember> {
    const results = await this.db.insert(schema.organizationMembers).values(member).returning();
    return results[0];
  }

  async getMembers(orgId: string): Promise<OrganizationMember[]> {
    return await this.db.select().from(schema.organizationMembers).where(eq(schema.organizationMembers.organizationId, orgId));
  }

  async getUserOrganizations(userId: string): Promise<Organization[]> {
    const list = await this.db
      .select({
        id: schema.organizations.id,
        name: schema.organizations.name,
        slug: schema.organizations.slug,
        createdAt: schema.organizations.createdAt,
        updatedAt: schema.organizations.updatedAt,
      })
      .from(schema.organizationMembers)
      .innerJoin(schema.organizations, eq(schema.organizationMembers.organizationId, schema.organizations.id))
      .where(eq(schema.organizationMembers.userId, userId));
    return list;
  }
}

export class DrizzleInvitationRepository implements InvitationRepository {
  constructor(private readonly db: any) {}

  async create(invitation: Omit<Invitation, "id" | "createdAt">): Promise<Invitation> {
    const results = await this.db.insert(schema.invitations).values(invitation).returning();
    const raw = results[0];
    return {
      ...raw,
      status: raw.status as "PENDING" | "ACCEPTED" | "REVOKED",
    };
  }

  async findByToken(token: string): Promise<Invitation | null> {
    const results = await this.db.select().from(schema.invitations).where(eq(schema.invitations.token, token)).limit(1);
    const raw = results[0];
    if (!raw) return null;
    return {
      ...raw,
      status: raw.status as "PENDING" | "ACCEPTED" | "REVOKED",
    };
  }

  async updateStatus(id: string, status: "PENDING" | "ACCEPTED" | "REVOKED"): Promise<void> {
    await this.db.update(schema.invitations).set({ status }).where(eq(schema.invitations.id, id));
  }
}

export class DrizzleOAuthRepository implements OAuthRepository {
  constructor(private readonly db: any) {}

  async createClient(client: Omit<OAuthClient, "id" | "createdAt">): Promise<OAuthClient> {
    const results = await this.db.insert(schema.oauthClients).values(client).returning();
    return results[0];
  }

  async findClientById(clientId: string): Promise<OAuthClient | null> {
    const results = await this.db.select().from(schema.oauthClients).where(eq(schema.oauthClients.clientId, clientId)).limit(1);
    return results[0] || null;
  }

  async getUserClients(userId: string): Promise<OAuthClient[]> {
    return await this.db.select().from(schema.oauthClients).where(eq(schema.oauthClients.userId, userId));
  }

  async createAuthorizationCode(code: Omit<OAuthAuthorizationCode, "id" | "createdAt">): Promise<OAuthAuthorizationCode> {
    const results = await this.db.insert(schema.oauthAuthorizationCodes).values(code).returning();
    const raw = results[0];
    return {
      ...raw,
      codeChallengeMethod: raw.codeChallengeMethod as "plain" | "S256",
    };
  }

  async findAuthorizationCode(code: string): Promise<OAuthAuthorizationCode | null> {
    const results = await this.db.select().from(schema.oauthAuthorizationCodes).where(eq(schema.oauthAuthorizationCodes.code, code)).limit(1);
    const raw = results[0];
    if (!raw) return null;
    return {
      ...raw,
      codeChallengeMethod: raw.codeChallengeMethod as "plain" | "S256",
    };
  }

  async deleteAuthorizationCode(code: string): Promise<void> {
    await this.db.delete(schema.oauthAuthorizationCodes).where(eq(schema.oauthAuthorizationCodes.code, code));
  }

  async createToken(token: Omit<OAuthToken, "id" | "createdAt">): Promise<OAuthToken> {
    const results = await this.db.insert(schema.oauthTokens).values(token).returning();
    return results[0];
  }

  async findTokenByAccessToken(accessToken: string): Promise<OAuthToken | null> {
    const results = await this.db.select().from(schema.oauthTokens).where(eq(schema.oauthTokens.accessToken, accessToken)).limit(1);
    return results[0] || null;
  }

  async findTokenByRefreshToken(refreshToken: string): Promise<OAuthToken | null> {
    const results = await this.db.select().from(schema.oauthTokens).where(eq(schema.oauthTokens.refreshToken, refreshToken)).limit(1);
    return results[0] || null;
  }

  async deleteToken(accessToken: string): Promise<void> {
    await this.db.delete(schema.oauthTokens).where(eq(schema.oauthTokens.accessToken, accessToken));
  }
}
