import { User, Session, VerificationToken, VerificationTokenType } from "./entities";
import { RoleRepository } from "./rbac";
import { OrganizationRepository, InvitationRepository } from "./organization";
import { OAuthRepository } from "./oauth";

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(user: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User>;
  update(id: string, user: Partial<Omit<User, "id" | "createdAt" | "updatedAt">>): Promise<User>;
  delete(id: string): Promise<void>;
}

export interface SessionRepository {
  findById(id: string): Promise<Session | null>;
  findByToken(token: string): Promise<Session | null>;
  create(session: Omit<Session, "id" | "createdAt">): Promise<Session>;
  deleteByToken(token: string): Promise<void>;
  deleteExpired(): Promise<void>;
}

export interface VerificationTokenRepository {
  findByTokenAndType(token: string, type: VerificationTokenType): Promise<VerificationToken | null>;
  create(tokenData: Omit<VerificationToken, "id" | "createdAt">): Promise<VerificationToken>;
  deleteByTokenAndType(token: string, type: VerificationTokenType): Promise<void>;
  deleteExpired(): Promise<void>;
}

export interface DatabaseAdapter {
  users: UserRepository;
  sessions: SessionRepository;
  verificationTokens: VerificationTokenRepository;
  roles: RoleRepository;
  organizations: OrganizationRepository;
  invitations: InvitationRepository;
  oauth: OAuthRepository;
}
