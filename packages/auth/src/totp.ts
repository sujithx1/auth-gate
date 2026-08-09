import { createHmac, randomBytes } from "crypto";

// Base32 Alphabet RFC 4648
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Decode(input: string): Buffer {
  const cleanInput = input.toUpperCase().replace(/=+$/, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < cleanInput.length; i++) {
    const val = BASE32_ALPHABET.indexOf(cleanInput.charAt(i));
    if (val === -1) {
      throw new Error("Invalid base32 character");
    }
    value = (value << 5) | val;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET.charAt((value >>> (bits - 5)) & 31);
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET.charAt((value << (5 - bits)) & 31);
  }
  while (output.length % 8 !== 0) {
    output += "=";
  }
  return output;
}

/**
 * Generate a new TOTP secret and corresponding provisioning URI.
 */
export function generateTotpSecret(email: string, issuer: string = "AuthGate"): { secret: string; uri: string } {
  const rawBytes = randomBytes(20);
  const secret = base32Encode(rawBytes).replace(/=+$/, ""); // clean secret
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedEmail = encodeURIComponent(email);
  const uri = `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;

  return { secret, uri };
}

/**
 * Verify a 6-digit TOTP token against a Base32 encoded secret.
 * Supports sliding window steps (default: 1 step window of 30 seconds back/forward to handle latency).
 */
export function verifyTotpToken(secret: string, token: string, windowSteps: number = 1): boolean {
  if (token.length !== 6 || !/^\d+$/.test(token)) {
    return false;
  }

  let key: Buffer;
  try {
    key = base32Decode(secret);
  } catch {
    return false;
  }

  const epoch = Math.floor(Date.now() / 1000);
  const counter = Math.floor(epoch / 30);

  // Check window steps back and forward
  for (let i = -windowSteps; i <= windowSteps; i++) {
    if (calculateTotpForCounter(key, counter + i) === token) {
      return true;
    }
  }

  return false;
}

function calculateTotpForCounter(key: Buffer, counter: number): string {
  // Counter needs to be 8-byte big-endian buffer
  const buffer = Buffer.alloc(8);
  // Write 32-bit values split
  buffer.writeUInt32BE(0, 0);
  buffer.writeUInt32BE(counter, 4);

  const hmac = createHmac("sha1", key);
  hmac.update(buffer);
  const hmacResult = hmac.digest();

  // Dynamic truncation
  const offset = hmacResult[hmacResult.length - 1] & 15;
  const binary =
    ((hmacResult[offset] & 127) << 24) |
    ((hmacResult[offset + 1] & 255) << 16) |
    ((hmacResult[offset + 2] & 255) << 8) |
    (hmacResult[offset + 3] & 255);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, "0");
}
