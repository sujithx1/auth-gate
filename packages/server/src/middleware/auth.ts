import { Context } from "hono";
import { getCookie, deleteCookie } from "hono/cookie";
import { UserRepository, SessionRepository } from "@authgate/core";
import { SessionService } from "@authgate/session";
import { AuthGateError } from "@authgate/shared";
import { Env } from "../types";

export const createAuthMiddleware = (
  userRepo: UserRepository,
  sessionService: SessionService
) => {
  return async (c: Context<Env>, next: () => Promise<void>) => {
    const token = getCookie(c, "authgate_session");
    if (!token) {
      throw new AuthGateError("UNAUTHORIZED", "No active session found", 401);
    }

    const session = await sessionService.validateSession(token);
    if (!session) {
      deleteCookie(c, "authgate_session", { path: "/" });
      throw new AuthGateError("UNAUTHORIZED", "Session has expired or is invalid", 401);
    }

    const user = await userRepo.findById(session.userId);
    if (!user) {
      deleteCookie(c, "authgate_session", { path: "/" });
      throw new AuthGateError("UNAUTHORIZED", "User no longer exists", 401);
    }

    c.set("user", user);
    c.set("session", session);
    await next();
  };
};

export const createPermissionMiddleware = (rbacService: any) => {
  return (permissionName: string) => {
    return async (c: Context<Env>, next: () => Promise<void>) => {
      const user = c.get("user");
      if (!user) {
        throw new AuthGateError("UNAUTHORIZED", "User context not found", 401);
      }

      const hasAccess = await rbacService.hasPermission(user.id, permissionName);
      if (!hasAccess) {
        throw new AuthGateError("FORBIDDEN", `Missing required permission: ${permissionName}`, 403);
      }

      await next();
    };
  };
};
