import { describe, expect, it, beforeEach } from "bun:test";
import { createInMemoryAdapter } from "@authgate/core";
import { AuthService } from "./auth.service";

describe("AuthService", () => {
  let authService: AuthService;
  let adapter: ReturnType<typeof createInMemoryAdapter>;

  beforeEach(() => {
    adapter = createInMemoryAdapter();
    authService = new AuthService(adapter.users, adapter.verificationTokens);
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
});
