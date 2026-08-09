import { describe, expect, it } from "bun:test";
import { generateTotpSecret, verifyTotpToken } from "./totp";

describe("TOTP MFA Logic", () => {
  it("should generate a valid secret and provisioning URI link", () => {
    const { secret, uri } = generateTotpSecret("user@example.com", "AuthGateTest");
    expect(secret).toBeDefined();
    expect(secret.length).toBeGreaterThan(10);
    expect(uri).toContain("otpauth://totp/AuthGateTest:user%40example.com");
    expect(uri).toContain(`secret=${secret}`);
  });

  it("should fail verification for incorrect passcodes", () => {
    const { secret } = generateTotpSecret("user@example.com");
    expect(verifyTotpToken(secret, "000000")).toBe(false);
    expect(verifyTotpToken(secret, "abc123")).toBe(false);
  });
});
