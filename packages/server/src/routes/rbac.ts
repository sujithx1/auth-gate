import { Hono } from "hono";
import { z } from "zod";
import { RbacService } from "@authgate/rbac";
import { Env, AuthGateServerConfig } from "../types";

const createRoleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

const createPermissionSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

const linkPermissionSchema = z.object({
  permissionName: z.string().min(1),
});

const assignRoleSchema = z.object({
  roleName: z.string().min(1),
});

export function createRbacRouter(
  rbacService: RbacService,
  authMiddleware: any,
  permissionGuard: any
,
  config: AuthGateServerConfig
) {
  const router = new Hono<Env>();

  // Secure all routes in this router
  router.use("*", authMiddleware);

  /**
   * Create Role.
   */
  router.post("/roles", permissionGuard("rbac:write"), async (c) => {
    const body = await c.req.json();
    const parsed = createRoleSchema.parse(body);

    const role = await rbacService.createRole(parsed.name, parsed.description);

    return c.json({
      success: true,
      data: { role },
    }, 201);
  });

  /**
   * Create Permission.
   */
  router.post("/permissions", permissionGuard("rbac:write"), async (c) => {
    const body = await c.req.json();
    const parsed = createPermissionSchema.parse(body);

    const permission = await rbacService.createPermission(parsed.name, parsed.description);

    return c.json({
      success: true,
      data: { permission },
    }, 201);
  });

  /**
   * Link Permission to Role.
   */
  router.post("/roles/:roleName/permissions", permissionGuard("rbac:write"), async (c) => {
    const roleName = c.req.param("roleName");
    const body = await c.req.json();
    const parsed = linkPermissionSchema.parse(body);

    await rbacService.addPermissionToRole(roleName, parsed.permissionName);

    return c.json({
      success: true,
      data: {},
    });
  });

  /**
   * Assign Role to User.
   */
  router.post("/users/:userId/roles", permissionGuard("rbac:write"), async (c) => {
    const userId = c.req.param("userId");
    const body = await c.req.json();
    const parsed = assignRoleSchema.parse(body);

    await rbacService.assignRoleToUser(userId, parsed.roleName);

    return c.json({
      success: true,
      data: {},
    });
  });

  /**
   * Get User Permissions list.
   */
  router.get("/users/:userId/permissions", async (c) => {
    const userId = c.req.param("userId");
    const permissions = await rbacService.getUserPermissions(userId);

    return c.json({
      success: true,
      data: { permissions },
    });
  });

  return router;
}
