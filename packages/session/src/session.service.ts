import { Session, SessionRepository } from "@authgate/core";
import { generateSecureToken } from "@authgate/shared";

export class SessionService {
  constructor(private readonly sessionRepo: SessionRepository) {}

  /**
   * Creates a new session for a user, expiring in 30 days.
   */
  async createSession(
    userId: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<Session> {
    const token = generateSecureToken(32);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days expiry

    return await this.sessionRepo.create({
      userId,
      token,
      expiresAt,
      userAgent,
      ipAddress,
    });
  }

  /**
   * Validates a session token and returns the session if valid.
   */
  async validateSession(token: string): Promise<Session | null> {
    const session = await this.sessionRepo.findByToken(token);
    if (!session) return null;

    if (new Date() > new Date(session.expiresAt)) {
      await this.sessionRepo.deleteByToken(token);
      return null;
    }

    return session;
  }

  /**
   * Invalidates a session (logout).
   */
  async invalidateSession(token: string): Promise<void> {
    await this.sessionRepo.deleteByToken(token);
  }

  /**
   * Cleans up all expired sessions in the database.
   */
  async cleanExpiredSessions(): Promise<void> {
    await this.sessionRepo.deleteExpired();
  }

  /**
   * Returns all active sessions for a user.
   */
  async getUserSessions(userId: string): Promise<Session[]> {
    return this.sessionRepo.findActiveByUserId(userId);
  }

  /**
   * Revokes a specific session belonging to a user.
   */
  async revokeSession(id: string, userId: string): Promise<void> {
    const session = await this.sessionRepo.findById(id);
    if (!session || session.userId !== userId) {
      throw new Error("Session not found or unauthorized.");
    }
    await this.sessionRepo.deleteById(id);
  }
}
