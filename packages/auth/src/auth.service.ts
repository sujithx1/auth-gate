import {
  User,
  UserRepository,
  VerificationTokenRepository,
  TwoFactorRepository,
} from "@authgate/core";
import {
  hashPassword,
  verifyPassword,
  generateSecureToken,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "@authgate/shared";
import { generateTotpSecret, verifyTotpToken } from "./totp";

export class AuthService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly tokenRepo: VerificationTokenRepository,
    private readonly twoFactorRepo: TwoFactorRepository
  ) {}

  /**
   * Registers a new user.
   */
  async register(
    email: string,
    password: string
  ): Promise<{ user: User; verificationToken: string }> {
    const normalizedEmail = email.toLowerCase().trim();
    
    // Check if user already exists
    const existingUser = await this.userRepo.findByEmail(normalizedEmail);
    if (existingUser) {
      throw new ConflictError("Email address is already in use.", "EMAIL_ALREADY_EXISTS");
    }

    // Hash password
    const hashed = await hashPassword(password);

    // Create user
    const user = await this.userRepo.create({
      email: normalizedEmail,
      passwordHash: hashed,
      isEmailVerified: false,
    });

    // Create email verification token
    const token = generateSecureToken(32);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours expiry

    await this.tokenRepo.create({
      userId: user.id,
      token,
      type: "EMAIL_VERIFICATION",
      expiresAt,
    });

    return { user, verificationToken: token };
  }

  /**
   * Authenticates a user by email and password.
   */
  async login(email: string, password: string): Promise<User> {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await this.userRepo.findByEmail(normalizedEmail);
    if (!user) {
      throw new UnauthorizedError("Invalid email or password.", "INVALID_CREDENTIALS");
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError("Invalid email or password.", "INVALID_CREDENTIALS");
    }

    // Check if 2FA is active
    const mfa = await this.twoFactorRepo.findByUserId(user.id);
    if (mfa && mfa.isActive) {
      throw new UnauthorizedError("Two-factor authentication is required.", "TWO_FACTOR_REQUIRED", {
        userId: user.id,
      });
    }

    return user;
  }

  /**
   * Login second step: verifies 2FA code or backup code.
   */
  async loginWithTwoFactor(userId: string, code: string): Promise<User> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found.");
    }

    const mfa = await this.twoFactorRepo.findByUserId(userId);
    if (!mfa || !mfa.isActive) {
      throw new ValidationError("Two-factor authentication is not enabled for this user.");
    }

    // 1. Verify TOTP token
    const isTotpValid = verifyTotpToken(mfa.secret, code);
    if (isTotpValid) {
      return user;
    }

    // 2. Fallback to verify backup code
    const isBackupValid = mfa.backupCodes.includes(code);
    if (isBackupValid) {
      // Remove used backup code
      const updatedBackupCodes = mfa.backupCodes.filter((c) => c !== code);
      await this.twoFactorRepo.createOrUpdate({
        userId: mfa.userId,
        secret: mfa.secret,
        isActive: mfa.isActive,
        backupCodes: updatedBackupCodes,
      });
      return user;
    }

    throw new UnauthorizedError("Invalid two-factor code.", "INVALID_2FA_CODE");
  }

  /**
   * Generate 2FA TOTP secret configuration.
   */
  async enableTwoFactor(userId: string): Promise<{ secret: string; uri: string }> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found.");
    }

    const { secret, uri } = generateTotpSecret(user.email);
    
    // Save as inactive until verified
    await this.twoFactorRepo.createOrUpdate({
      userId,
      secret,
      isActive: false,
      backupCodes: [],
    });

    return { secret, uri };
  }

  /**
   * Verify and activate 2FA secret with initial setup code. Returns backup codes.
   */
  async verifyTwoFactor(userId: string, code: string): Promise<{ backupCodes: string[] }> {
    const mfa = await this.twoFactorRepo.findByUserId(userId);
    if (!mfa) {
      throw new ValidationError("Two-factor authentication secret has not been generated.");
    }

    const isValid = verifyTotpToken(mfa.secret, code);
    if (!isValid) {
      throw new ValidationError("Invalid authentication code.");
    }

    // Generate 10 backup codes
    const backupCodes: string[] = [];
    for (let i = 0; i < 10; i++) {
      backupCodes.push(generateSecureToken(8));
    }

    await this.twoFactorRepo.createOrUpdate({
      userId,
      secret: mfa.secret,
      isActive: true,
      backupCodes, // Save plain backup codes in this mock setup for simplicity
    });

    return { backupCodes };
  }

  /**
   * Disable 2FA.
   */
  async disableTwoFactor(userId: string, code: string): Promise<void> {
    const mfa = await this.twoFactorRepo.findByUserId(userId);
    if (!mfa || !mfa.isActive) {
      throw new ValidationError("Two-factor authentication is not enabled.");
    }

    const isValid = verifyTotpToken(mfa.secret, code);
    if (!isValid) {
      throw new ValidationError("Invalid authentication code.");
    }

    await this.twoFactorRepo.deleteByUserId(userId);
  }

  /**
   * Verifies a user's email address using a verification token.
   */
  async verifyEmail(token: string): Promise<User> {
    const verificationToken = await this.tokenRepo.findByTokenAndType(
      token,
      "EMAIL_VERIFICATION"
    );

    if (!verificationToken) {
      throw new ValidationError("Invalid or expired verification token.");
    }

    if (new Date() > new Date(verificationToken.expiresAt)) {
      await this.tokenRepo.deleteByTokenAndType(token, "EMAIL_VERIFICATION");
      throw new ValidationError("Verification token has expired.");
    }

    const user = await this.userRepo.findById(verificationToken.userId);
    if (!user) {
      throw new NotFoundError("User not found.");
    }

    const updatedUser = await this.userRepo.update(user.id, {
      isEmailVerified: true,
    });

    await this.tokenRepo.deleteByTokenAndType(token, "EMAIL_VERIFICATION");

    return updatedUser;
  }

  /**
   * Initiates the password reset workflow by generating a reset token.
   */
  async forgotPassword(email: string): Promise<string | null> {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await this.userRepo.findByEmail(normalizedEmail);
    if (!user) {
      // Return null or silently succeed to prevent user enumeration
      return null;
    }

    const token = generateSecureToken(32);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

    await this.tokenRepo.create({
      userId: user.id,
      token,
      type: "PASSWORD_RESET",
      expiresAt,
    });

    return token;
  }

  /**
   * Resets the user's password using the reset token.
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const resetToken = await this.tokenRepo.findByTokenAndType(
      token,
      "PASSWORD_RESET"
    );

    if (!resetToken) {
      throw new ValidationError("Invalid or expired password reset token.");
    }

    if (new Date() > new Date(resetToken.expiresAt)) {
      await this.tokenRepo.deleteByTokenAndType(token, "PASSWORD_RESET");
      throw new ValidationError("Password reset token has expired.");
    }

    const hashed = await hashPassword(newPassword);
    await this.userRepo.update(resetToken.userId, {
      passwordHash: hashed,
    });

    await this.tokenRepo.deleteByTokenAndType(token, "PASSWORD_RESET");
  }
}
