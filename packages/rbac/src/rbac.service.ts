import { Role, Permission, RoleRepository } from "@authgate/core";
import { ConflictError, NotFoundError } from "@authgate/shared";

export class RbacService {
  constructor(private readonly roleRepo: RoleRepository) {}

  async createRole(name: string, description?: string): Promise<Role> {
    const existing = await this.roleRepo.findRoleByName(name);
    if (existing) {
      throw new ConflictError(`Role "${name}" already exists.`, "ROLE_ALREADY_EXISTS");
    }
    return await this.roleRepo.createRole({ name, description });
  }

  async createPermission(name: string, description?: string): Promise<Permission> {
    const existing = await this.roleRepo.findPermissionByName(name);
    if (existing) {
      throw new ConflictError(`Permission "${name}" already exists.`, "PERMISSION_ALREADY_EXISTS");
    }
    return await this.roleRepo.createPermission({ name, description });
  }

  async addPermissionToRole(roleName: string, permissionName: string): Promise<void> {
    const role = await this.roleRepo.findRoleByName(roleName);
    if (!role) throw new NotFoundError(`Role "${roleName}" not found.`);

    const permission = await this.roleRepo.findPermissionByName(permissionName);
    if (!permission) throw new NotFoundError(`Permission "${permissionName}" not found.`);

    await this.roleRepo.addPermissionToRole(role.id, permission.id);
  }

  async assignRoleToUser(userId: string, roleName: string): Promise<void> {
    const role = await this.roleRepo.findRoleByName(roleName);
    if (!role) throw new NotFoundError(`Role "${roleName}" not found.`);

    await this.roleRepo.assignRoleToUser(userId, role.id);
  }

  async getUserPermissions(userId: string): Promise<Permission[]> {
    return await this.roleRepo.getUserPermissions(userId);
  }

  async hasPermission(userId: string, permissionName: string): Promise<boolean> {
    const perms = await this.roleRepo.getUserPermissions(userId);
    return perms.some((p) => p.name === permissionName);
  }
}
