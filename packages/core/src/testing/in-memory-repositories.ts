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

export function createInMemoryAdapter(): DatabaseAdapter {
  return {
    users: new InMemoryUserRepository(),
    sessions: new InMemorySessionRepository(),
    verificationTokens: new InMemoryVerificationTokenRepository(),
  };
}
