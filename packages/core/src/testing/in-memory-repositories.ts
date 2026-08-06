import {
  User,
  Session,
  VerificationToken,
  VerificationTokenType,
} from "../domain/entities";

import {
  UserRepository,
  SessionRepository,
  VerificationTokenRepository,
  DatabaseAdapter,
} from "../domain/repositories";

export class InMemoryUserRepository implements UserRepository {
  public users: Map<string, User> = new Map();

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) return user;
    }
    return null;
  }

  async create(user: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User> {
    const id = crypto.randomUUID();
    const now = new Date();
    const created: User = {
      ...user,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(id, created);
    return created;
  }

  async update(
    id: string,
    user: Partial<Omit<User, "id" | "createdAt" | "updatedAt">>
  ): Promise<User> {
    const existing = this.users.get(id);
    if (!existing) throw new Error("User not found");

    const updated: User = {
      ...existing,
      ...user,
      updatedAt: new Date(),
    };
    this.users.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.users.delete(id);
  }
}

export class InMemorySessionRepository implements SessionRepository {
  public sessions: Map<string, Session> = new Map();

  async findById(id: string): Promise<Session | null> {
    return this.sessions.get(id) || null;
  }

  async findByToken(token: string): Promise<Session | null> {
    for (const session of this.sessions.values()) {
      if (session.token === token) return session;
    }
    return null;
  }

  async create(session: Omit<Session, "id" | "createdAt">): Promise<Session> {
    const id = crypto.randomUUID();
    const created: Session = {
      ...session,
      id,
      createdAt: new Date(),
    };
    this.sessions.set(id, created);
    return created;
  }

  async deleteByToken(token: string): Promise<void> {
    for (const [id, session] of this.sessions.entries()) {
      if (session.token === token) {
        this.sessions.delete(id);
        break;
      }
    }
  }

  async deleteExpired(): Promise<void> {
    const now = new Date();
    for (const [id, session] of this.sessions.entries()) {
      if (new Date(session.expiresAt) < now) {
        this.sessions.delete(id);
      }
    }
  }
}

export class InMemoryVerificationTokenRepository implements VerificationTokenRepository {
  public tokens: Map<string, VerificationToken> = new Map();

  async findByTokenAndType(
    token: string,
    type: VerificationTokenType
  ): Promise<VerificationToken | null> {
    for (const t of this.tokens.values()) {
      if (t.token === token && t.type === type) return t;
    }
    return null;
  }

  async create(
    tokenData: Omit<VerificationToken, "id" | "createdAt">
  ): Promise<VerificationToken> {
    const id = crypto.randomUUID();
    const created: VerificationToken = {
      ...tokenData,
      id,
      createdAt: new Date(),
    };
    this.tokens.set(id, created);
    return created;
  }

  async deleteByTokenAndType(token: string, type: VerificationTokenType): Promise<void> {
    for (const [id, t] of this.tokens.entries()) {
      if (t.token === token && t.type === type) {
        this.tokens.delete(id);
        break;
      }
    }
  }

  async deleteExpired(): Promise<void> {
    const now = new Date();
    for (const [id, t] of this.tokens.entries()) {
      if (new Date(t.expiresAt) < now) {
        this.tokens.delete(id);
      }
    }
  }
}

import {
  Role,
  Permission,
  UserRole,
  RolePermission,
  RoleRepository,
} from "../domain/rbac";
import {
  Organization,
  OrganizationMember,
  Invitation,
  OrganizationRepository,
  InvitationRepository,
} from "../domain/organization";

export class InMemoryRoleRepository implements RoleRepository {
  public roles: Map<string, Role> = new Map();
  public permissions: Map<string, Permission> = new Map();
  public userRoles: UserRole[] = [];
  public rolePermissions: RolePermission[] = [];

  async createRole(role: Omit<Role, "id" | "createdAt">): Promise<Role> {
    const id = crypto.randomUUID();
    const created: Role = { ...role, id, createdAt: new Date() };
    this.roles.set(id, created);
    return created;
  }

  async createPermission(permission: Omit<Permission, "id" | "createdAt">): Promise<Permission> {
    const id = crypto.randomUUID();
    const created: Permission = { ...permission, id, createdAt: new Date() };
    this.permissions.set(id, created);
    return created;
  }

  async findRoleByName(name: string): Promise<Role | null> {
    for (const r of this.roles.values()) {
      if (r.name === name) return r;
    }
    return null;
  }

  async findPermissionByName(name: string): Promise<Permission | null> {
    for (const p of this.permissions.values()) {
      if (p.name === name) return p;
    }
    return null;
  }

  async addPermissionToRole(roleId: string, permissionId: string): Promise<void> {
    const id = crypto.randomUUID();
    this.rolePermissions.push({ id, roleId, permissionId });
  }

  async assignRoleToUser(userId: string, roleId: string): Promise<void> {
    const id = crypto.randomUUID();
    this.userRoles.push({ id, userId, roleId });
  }

  async getUserPermissions(userId: string): Promise<Permission[]> {
    const roles = await this.getUserRoles(userId);
    const roleIds = roles.map((r) => r.id);
    const permIds = this.rolePermissions
      .filter((rp) => roleIds.includes(rp.roleId))
      .map((rp) => rp.permissionId);
    
    return Array.from(this.permissions.values()).filter((p) => permIds.includes(p.id));
  }

  async getUserRoles(userId: string): Promise<Role[]> {
    const roleIds = this.userRoles.filter((ur) => ur.userId === userId).map((ur) => ur.roleId);
    return Array.from(this.roles.values()).filter((r) => roleIds.includes(r.id));
  }
}

export class InMemoryOrganizationRepository implements OrganizationRepository {
  public orgs: Map<string, Organization> = new Map();
  public members: OrganizationMember[] = [];

  async findById(id: string): Promise<Organization | null> {
    return this.orgs.get(id) || null;
  }

  async findBySlug(slug: string): Promise<Organization | null> {
    for (const o of this.orgs.values()) {
      if (o.slug === slug) return o;
    }
    return null;
  }

  async create(org: Omit<Organization, "id" | "createdAt" | "updatedAt">): Promise<Organization> {
    const id = crypto.randomUUID();
    const now = new Date();
    const created: Organization = { ...org, id, createdAt: now, updatedAt: now };
    this.orgs.set(id, created);
    return created;
  }

  async addMember(member: Omit<OrganizationMember, "id" | "createdAt">): Promise<OrganizationMember> {
    const id = crypto.randomUUID();
    const created: OrganizationMember = { ...member, id, createdAt: new Date() };
    this.members.push(created);
    return created;
  }

  async getMembers(orgId: string): Promise<OrganizationMember[]> {
    return this.members.filter((m) => m.organizationId === orgId);
  }

  async getUserOrganizations(userId: string): Promise<Organization[]> {
    const orgIds = this.members.filter((m) => m.userId === userId).map((m) => m.organizationId);
    return Array.from(this.orgs.values()).filter((o) => orgIds.includes(o.id));
  }
}

export class InMemoryInvitationRepository implements InvitationRepository {
  public invitations: Map<string, Invitation> = new Map();

  async create(invitation: Omit<Invitation, "id" | "createdAt">): Promise<Invitation> {
    const id = crypto.randomUUID();
    const created: Invitation = { ...invitation, id, createdAt: new Date() };
    this.invitations.set(id, created);
    return created;
  }

  async findByToken(token: string): Promise<Invitation | null> {
    for (const i of this.invitations.values()) {
      if (i.token === token) return i;
    }
    return null;
  }

  async updateStatus(id: string, status: "PENDING" | "ACCEPTED" | "REVOKED"): Promise<void> {
    const inv = this.invitations.get(id);
    if (inv) {
      inv.status = status;
    }
  }
}

import {
  OAuthClient,
  OAuthAuthorizationCode,
  OAuthToken,
  OAuthRepository,
} from "../domain/oauth";

export class InMemoryOAuthRepository implements OAuthRepository {
  public clients: Map<string, OAuthClient> = new Map();
  public codes: Map<string, OAuthAuthorizationCode> = new Map();
  public tokens: Map<string, OAuthToken> = new Map();

  async createClient(client: Omit<OAuthClient, "id" | "createdAt">): Promise<OAuthClient> {
    const id = crypto.randomUUID();
    const created: OAuthClient = { ...client, id, createdAt: new Date() };
    this.clients.set(id, created);
    return created;
  }

  async findClientById(clientId: string): Promise<OAuthClient | null> {
    for (const c of this.clients.values()) {
      if (c.clientId === clientId) return c;
    }
    return null;
  }

  async getUserClients(userId: string): Promise<OAuthClient[]> {
    return Array.from(this.clients.values()).filter((c) => c.userId === userId);
  }

  async createAuthorizationCode(code: Omit<OAuthAuthorizationCode, "id" | "createdAt">): Promise<OAuthAuthorizationCode> {
    const id = crypto.randomUUID();
    const created: OAuthAuthorizationCode = { ...code, id, createdAt: new Date() };
    this.codes.set(code.code, created);
    return created;
  }

  async findAuthorizationCode(code: string): Promise<OAuthAuthorizationCode | null> {
    return this.codes.get(code) || null;
  }

  async deleteAuthorizationCode(code: string): Promise<void> {
    this.codes.delete(code);
  }

  async createToken(token: Omit<OAuthToken, "id" | "createdAt">): Promise<OAuthToken> {
    const id = crypto.randomUUID();
    const created: OAuthToken = { ...token, id, createdAt: new Date() };
    this.tokens.set(token.accessToken, created);
    return created;
  }

  async findTokenByAccessToken(accessToken: string): Promise<OAuthToken | null> {
    return this.tokens.get(accessToken) || null;
  }

  async findTokenByRefreshToken(refreshToken: string): Promise<OAuthToken | null> {
    for (const t of this.tokens.values()) {
      if (t.refreshToken === refreshToken) return t;
    }
    return null;
  }

  async deleteToken(accessToken: string): Promise<void> {
    this.tokens.delete(accessToken);
  }
}

export function createInMemoryAdapter(): DatabaseAdapter {
  return {
    users: new InMemoryUserRepository(),
    sessions: new InMemorySessionRepository(),
    verificationTokens: new InMemoryVerificationTokenRepository(),
    roles: new InMemoryRoleRepository(),
    organizations: new InMemoryOrganizationRepository(),
    invitations: new InMemoryInvitationRepository(),
    oauth: new InMemoryOAuthRepository(),
  };
}
