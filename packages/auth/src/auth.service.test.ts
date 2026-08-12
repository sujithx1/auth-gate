import { describe, expect, it, beforeEach } from "bun:test";
import { createInMemoryAdapter } from "@authgate/core";
import { AuthService } from "./auth.service";

describe("AuthService", () => {
  let authService: AuthService;
  let adapter: ReturnType<typeof createInMemoryAdapter>;

  beforeEach(() => {
    adapter = createInMemoryAdapter();
    authService = new AuthService(
      adapter.users,
      adapter.verificationTokens,
      adapter.twoFactor,
      adapter.otpCodes,
      adapter.socialAccounts
    );
  });

  it("should register a new user and create email verification token", async () => {
    const { user, verificationToken } = await authService.register(
      "test@example.com",
      "password123"
    );

    expect(user).toBeDefined();
    expect(user.email).toBe("test@example.com");
    expect(user.isEmailVerified).toBe(false);
    expect(verificationToken).toBeDefined();

    const storedUser = await adapter.users.findByEmail("test@example.com");
    expect(storedUser).toBeDefined();
    expect(storedUser?.id).toBe(user.id);
  });

  it("should not allow registering with existing email", async () => {
    await authService.register("test@example.com", "password123");

    expect(
      authService.register("test@example.com", "anotherpassword")
    ).rejects.toThrow("Email address is already in use.");
  });

  it("should successfully log in a user with correct credentials", async () => {
    await authService.register("test@example.com", "password123");

    const user = await authService.login("test@example.com", "password123");
    expect(user).toBeDefined();
    expect(user.email).toBe("test@example.com");
  });

  it("should throw error on login with incorrect credentials", async () => {
    await authService.register("test@example.com", "password123");

    expect(
      authService.login("test@example.com", "wrongpassword")
    ).rejects.toThrow("Invalid email or password.");
  });

  it("should verify email with valid verification token", async () => {
    const { verificationToken } = await authService.register(
      "test@example.com",
      "password123"
    );

    const verifiedUser = await authService.verifyEmail(verificationToken);
    expect(verifiedUser.isEmailVerified).toBe(true);

    const checkUser = await adapter.users.findByEmail("test@example.com");
    expect(checkUser?.isEmailVerified).toBe(true);
  });

  it("should handle forgot password and reset password successfully", async () => {
    await authService.register("test@example.com", "password123");

    const resetToken = await authService.forgotPassword("test@example.com");
    expect(resetToken).not.toBeNull();

    await authService.resetPassword(resetToken!, "newpassword123");

    // Login with new password should succeed
    const user = await authService.login("test@example.com", "newpassword123");
    expect(user).toBeDefined();
  });

  it("should generate a random OTP numeric code and verify it successfully", async () => {
    const email = "otp-user@example.com";
    const { code } = await authService.generateOtp(email, 6, 60);

    expect(code).toBeDefined();
    expect(code.length).toBe(6);
    expect(/^\d+$/.test(code)).toBe(true);

    // Verify OTP and assert auto-registration
    const user = await authService.verifyOtp(email, code);
    expect(user).toBeDefined();
    expect(user.email).toBe(email);
    expect(user.isEmailVerified).toBe(true);
  });

  it("should successfully register and link social provider accounts", async () => {
    const provider = "google";
    const providerUserId = "google-id-123";
    const email = "social@example.com";

    // 1. Initial login should register and link the account
    const user = await authService.loginOrRegisterWithSocial(provider, providerUserId, email);
    expect(user).toBeDefined();
    expect(user.email).toBe(email);
    expect(user.isEmailVerified).toBe(true);

    // Assert link exists in repo
    const links = await adapter.socialAccounts.findByUserId(user.id);
    expect(links.length).toBe(1);
    expect(links[0].provider).toBe(provider);
    expect(links[0].providerUserId).toBe(providerUserId);

    // 2. Subsequent login should retrieve the same user
    const retrieved = await authService.loginOrRegisterWithSocial(provider, providerUserId, email);
    expect(retrieved.id).toBe(user.id);
  });
});
