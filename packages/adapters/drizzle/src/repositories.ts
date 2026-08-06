import { eq, and, lt } from "drizzle-orm";
import {
  User,
  UserRepository,
  Session,
  SessionRepository,
  VerificationToken,
  VerificationTokenRepository,
  VerificationTokenType,
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
