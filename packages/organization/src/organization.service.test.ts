import { describe, expect, it, beforeEach } from "bun:test";
import { createInMemoryAdapter } from "@authgate/core";
import { OrganizationService } from "./organization.service";

describe("OrganizationService", () => {
  let orgService: OrganizationService;
  let adapter: ReturnType<typeof createInMemoryAdapter>;

  beforeEach(() => {
    adapter = createInMemoryAdapter();
    orgService = new OrganizationService(adapter.organizations, adapter.invitations);
  });

  it("should create an organization and add creator as ADMIN", async () => {
    const userId = crypto.randomUUID();
    const org = await orgService.createOrganization("Acme Corp", "acme", userId);

    expect(org).toBeDefined();
    expect(org.name).toBe("Acme Corp");
    expect(org.slug).toBe("acme");

    const members = await orgService.getMembers(org.id);
    expect(members.length).toBe(1);
    expect(members[0].userId).toBe(userId);
    expect(members[0].role).toBe("ADMIN");
  });

  it("should create invitations and accept them successfully", async () => {
    const creatorId = crypto.randomUUID();
    const org = await orgService.createOrganization("Acme Corp", "acme", creatorId);

    const invite = await orgService.createInvitation(org.id, "guest@example.com", "MEMBER");
    expect(invite).toBeDefined();
    expect(invite.email).toBe("guest@example.com");
    expect(invite.status).toBe("PENDING");

    const newUserId = crypto.randomUUID();
    await orgService.acceptInvitation(invite.token, newUserId);

    const members = await orgService.getMembers(org.id);
    expect(members.length).toBe(2);
    expect(members.some((m) => m.userId === newUserId && m.role === "MEMBER")).toBe(true);
  });
});
