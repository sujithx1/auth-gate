import { describe, expect, it, beforeEach } from "bun:test";
import { createInMemoryAdapter } from "@authgate/core";
import { RbacService } from "./rbac.service";

describe("RbacService", () => {
  let rbacService: RbacService;
  let adapter: ReturnType<typeof createInMemoryAdapter>;

  beforeEach(() => {
    adapter = createInMemoryAdapter();
    rbacService = new RbacService(adapter.roles);
  });

  it("should create a role and a permission", async () => {
    const role = await rbacService.createRole("Admin", "Administrator role");
    expect(role).toBeDefined();
    expect(role.name).toBe("Admin");

    const permission = await rbacService.createPermission("users:write", "Write user data");
    expect(permission).toBeDefined();
    expect(permission.name).toBe("users:write");
  });

  it("should link permissions to roles and assign roles to users", async () => {
    await rbacService.createRole("Admin");
    await rbacService.createPermission("users:write");
    await rbacService.addPermissionToRole("Admin", "users:write");

    const userId = crypto.randomUUID();
    await rbacService.assignRoleToUser(userId, "Admin");

    const hasAccess = await rbacService.hasPermission(userId, "users:write");
    expect(hasAccess).toBe(true);

    const hasNoAccess = await rbacService.hasPermission(userId, "billing:write");
    expect(hasNoAccess).toBe(false);
  });
});
