import { Hono } from "hono";
import { z } from "zod";
import { OrganizationService } from "@authgate/organization";
import { Env, AuthGateServerConfig } from "../types";

const createOrgSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
});

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.string().default("MEMBER"),
});

export function createOrganizationRouter(
  orgService: OrganizationService,
  authMiddleware: any
,
  config: AuthGateServerConfig
) {
  const router = new Hono<Env>();

  // Secure all routes in this router
  router.use("*", authMiddleware);

  /**
   * Create Organization.
   */
  router.post("/", async (c) => {
    const body = await c.req.json();
    const parsed = createOrgSchema.parse(body);
    const user = c.get("user");

    const org = await orgService.createOrganization(parsed.name, parsed.slug, user.id);

    return c.json({
      success: true,
      data: { org },
    }, 201);
  });

  /**
   * List user's organizations.
   */
  router.get("/", async (c) => {
    const user = c.get("user");
    const orgs = await orgService.getUserOrganizations(user.id);

    return c.json({
      success: true,
      data: { orgs },
    });
  });

  /**
   * Invite member to organization.
   */
  router.post("/:id/invite", async (c) => {
    const orgId = c.req.param("id");
    const body = await c.req.json();
    const parsed = inviteSchema.parse(body);

    const invitation = await orgService.createInvitation(orgId, parsed.email, parsed.role);

    return c.json({
      success: true,
      data: { invitation },
    }, 201);
  });

  /**
   * Accept Invitation.
   */
  router.post("/invitations/:token/accept", async (c) => {
    const token = c.req.param("token");
    const user = c.get("user");

    await orgService.acceptInvitation(token, user.id);

    return c.json({
      success: true,
      data: {},
    });
  });

  /**
   * List organization members.
   */
  router.get("/:id/members", async (c) => {
    const orgId = c.req.param("id");
    const members = await orgService.getMembers(orgId);

    return c.json({
      success: true,
      data: { members },
    });
  });

  return router;
}
