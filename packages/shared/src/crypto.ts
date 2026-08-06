import { randomBytes } from "crypto";

export async function hashPassword(password: string): Promise<string> {
  // Bun.password uses bcrypt by default, which is secure and standard.
  return await Bun.password.hash(password);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await Bun.password.verify(password, hash);
}

export function generateSecureToken(length: number = 32): string {
  return randomBytes(length).toString("hex");
}
