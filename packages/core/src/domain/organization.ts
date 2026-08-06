export interface Organization {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: string; // e.g. "ADMIN", "MEMBER"
  createdAt: Date;
}

export interface Invitation {
  id: string;
  organizationId: string;
  email: string;
  role: string;
  token: string;
  expiresAt: Date;
  status: "PENDING" | "ACCEPTED" | "REVOKED";
  createdAt: Date;
}

export interface OrganizationRepository {
  findById(id: string): Promise<Organization | null>;
  findBySlug(slug: string): Promise<Organization | null>;
  create(org: Omit<Organization, "id" | "createdAt" | "updatedAt">): Promise<Organization>;
  addMember(member: Omit<OrganizationMember, "id" | "createdAt">): Promise<OrganizationMember>;
  getMembers(orgId: string): Promise<OrganizationMember[]>;
  getUserOrganizations(userId: string): Promise<Organization[]>;
}

export interface InvitationRepository {
  create(invitation: Omit<Invitation, "id" | "createdAt">): Promise<Invitation>;
  findByToken(token: string): Promise<Invitation | null>;
  updateStatus(id: string, status: "PENDING" | "ACCEPTED" | "REVOKED"): Promise<void>;
}
