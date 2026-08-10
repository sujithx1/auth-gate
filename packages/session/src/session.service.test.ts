import { describe, expect, it, beforeEach } from "bun:test";
import { createInMemoryAdapter } from "@authgate/core";
import { SessionService } from "./session.service";

describe("SessionService", () => {
  let sessionService: SessionService;
  let adapter: ReturnType<typeof createInMemoryAdapter>;

  beforeEach(() => {
    adapter = createInMemoryAdapter();
    sessionService = new SessionService(adapter.sessions);
  });

  it("should create a session for a user", async () => {
    const userId = crypto.randomUUID();
    const session = await sessionService.createSession(userId, "Mozilla/5.0", "127.0.0.1");

    expect(session).toBeDefined();
    expect(session.userId).toBe(userId);
    expect(session.token).toBeDefined();
    expect(session.userAgent).toBe("Mozilla/5.0");
    expect(session.ipAddress).toBe("127.0.0.1");

    const retrieved = await sessionService.validateSession(session.token);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.userId).toBe(userId);
  });

  it("should invalidate session when logged out", async () => {
    const userId = crypto.randomUUID();
    const session = await sessionService.createSession(userId);

    await sessionService.invalidateSession(session.token);

    const retrieved = await sessionService.validateSession(session.token);
    expect(retrieved).toBeNull();
  });

  it("should query all active sessions and revoke targeted sessions successfully", async () => {
    const userId = crypto.randomUUID();
    const session1 = await sessionService.createSession(userId, "Device A", "1.1.1.1");
    const session2 = await sessionService.createSession(userId, "Device B", "2.2.2.2");

    // Fetch active sessions
    const active = await sessionService.getUserSessions(userId);
    expect(active.length).toBe(2);
    expect(active.map((s) => s.id)).toContain(session1.id);
    expect(active.map((s) => s.id)).toContain(session2.id);

    // Revoke session1
    await sessionService.revokeSession(session1.id, userId);

    const activePostRevoke = await sessionService.getUserSessions(userId);
    expect(activePostRevoke.length).toBe(1);
    expect(activePostRevoke[0].id).toBe(session2.id);
  });
});
