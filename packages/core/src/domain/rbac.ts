export interface Permission {
  id: string;
  name: string; // e.g. "users:read", "orgs:write"
  description?: string;
  createdAt: Date;
}

export interface Role {
  id: string;
  name: string; // e.g. "Admin", "User"
  description?: string;
  createdAt: Date;
}

export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
}

export interface RolePermission {
  id: string;
  roleId: string;
  permissionId: string;
}

export interface RoleRepository {
  createRole(role: Omit<Role, "id" | "createdAt">): Promise<Role>;
  createPermission(permission: Omit<Permission, "id" | "createdAt">): Promise<Permission>;
  findRoleByName(name: string): Promise<Role | null>;
  findPermissionByName(name: string): Promise<Permission | null>;
  addPermissionToRole(roleId: string, permissionId: string): Promise<void>;
  assignRoleToUser(userId: string, roleId: string): Promise<void>;
  getUserPermissions(userId: string): Promise<Permission[]>;
  getUserRoles(userId: string): Promise<Role[]>;
}
