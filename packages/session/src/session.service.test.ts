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
});
