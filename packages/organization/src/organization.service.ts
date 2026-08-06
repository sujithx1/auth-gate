import { Organization, OrganizationMember, Invitation, OrganizationRepository, InvitationRepository } from "@authgate/core";
import { ConflictError, NotFoundError, ValidationError, generateSecureToken } from "@authgate/shared";

export class OrganizationService {
  constructor(
    private readonly orgRepo: OrganizationRepository,
    private readonly inviteRepo: InvitationRepository
  ) {}

  async createOrganization(name: string, slug: string, creatorUserId: string): Promise<Organization> {
    const existing = await this.orgRepo.findBySlug(slug);
    if (existing) {
      throw new ConflictError(`Organization slug "${slug}" is already in use.`, "SLUG_ALREADY_EXISTS");
    }

    const org = await this.orgRepo.create({ name, slug });
    
    // Add creator as owner/admin
    await this.orgRepo.addMember({
      organizationId: org.id,
      userId: creatorUserId,
      role: "ADMIN",
    });

    return org;
  }

  async createInvitation(organizationId: string, email: string, role: string): Promise<Invitation> {
    const org = await this.orgRepo.findById(organizationId);
    if (!org) throw new NotFoundError("Organization not found.");

    const token = generateSecureToken(32);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    return await this.inviteRepo.create({
      organizationId,
      email,
      role,
      token,
      expiresAt,
      status: "PENDING",
    });
  }

  async acceptInvitation(token: string, userId: string): Promise<void> {
    const invitation = await this.inviteRepo.findByToken(token);
    if (!invitation) throw new ValidationError("Invalid or expired invitation token.");

    if (invitation.status !== "PENDING") {
      throw new ValidationError(`Invitation has already been ${invitation.status.toLowerCase()}.`);
    }

    if (new Date() > new Date(invitation.expiresAt)) {
      await this.inviteRepo.updateStatus(invitation.id, "REVOKED");
      throw new ValidationError("Invitation has expired.");
    }

    // Add user as member to the organization
    await this.orgRepo.addMember({
      organizationId: invitation.organizationId,
      userId,
      role: invitation.role,
    });

    // Update invitation status
    await this.inviteRepo.updateStatus(invitation.id, "ACCEPTED");
  }

  async getMembers(orgId: string): Promise<OrganizationMember[]> {
    return await this.orgRepo.getMembers(orgId);
  }

  async getUserOrganizations(userId: string): Promise<Organization[]> {
    return await this.orgRepo.getUserOrganizations(userId);
  }
}
