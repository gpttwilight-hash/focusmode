import { createHash, randomInt } from "node:crypto";
import bcrypt from "bcryptjs";

const CODE_TTL_MINUTES = 10;
const CODE_HASH_COST = 10;

export function generateVerificationCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export async function hashVerificationCode(code: string): Promise<string> {
  return bcrypt.hash(code, CODE_HASH_COST);
}

export async function verifyVerificationCode(code: string, codeHash: string): Promise<boolean> {
  return bcrypt.compare(code, codeHash);
}

export function createCodeExpiry(now = new Date()): Date {
  return new Date(now.getTime() + CODE_TTL_MINUTES * 60 * 1000);
}

export function isCodeExpired(expiresAt: Date, now = new Date()): boolean {
  return now.getTime() >= expiresAt.getTime();
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function hashRateLimitKey(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
