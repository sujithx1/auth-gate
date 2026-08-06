# AuthGate: Stage 2 Documentation

This document describes the design and implementation of **Stage 2: RBAC & Multi-Tenancy** inside AuthGate.

---

## 1. Domain Entities & Database Schemas

### RBAC (Role-Based Access Control)
- **Role**: Defines a group of permissions (e.g. `Admin`, `Member`).
- **Permission**: A resource action key (e.g. `rbac:write`, `orgs:invite`).
- **UserRole**: Maps a user to a role.
- **RolePermission**: Maps a role to permission privileges.

### Multi-Tenancy (Organizations)
- **Organization**: A workspace partition under a unique `slug`.
- **OrganizationMember**: Links users to an organization with a local workspace role (e.g. `ADMIN`, `MEMBER`).
- **Invitation**: Holds PENDING, ACCEPTED, or REVOKED invites sent to emails, mapped to secure unique tokens.

---

## 2. API Endpoints

### Organization Routes (`/api/orgs`)
- `POST /`: Creates an organization and adds the creator user as an `ADMIN`.
- `GET /`: Lists all organizations the authenticated user belongs to.
- `POST /:id/invite`: Creates a workspace invitation for a target email.
- `POST /invitations/:token/accept`: Accepts the invitation token and joins the organization.
- `GET /:id/members`: Lists the membership identities inside the organization.

### RBAC Routes (`/api/rbac`)
- `POST /roles`: Creates a new Role (Requires `rbac:write` permission).
- `POST /permissions`: Creates a new Permission (Requires `rbac:write` permission).
- `POST /roles/:roleName/permissions`: Connects a permission to a role.
- `POST /users/:userId/roles`: Assigns a role to a user.
- `GET /users/:userId/permissions`: Returns all resolved permissions for a user.
