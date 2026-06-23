import { describe, expect, it } from "vitest";
import {
  createCodeExpiry,
  generateVerificationCode,
  hashVerificationCode,
  isCodeExpired,
  verifyVerificationCode,
} from "./verification-code";

describe("verification code helpers", () => {
  it("generates a six digit numeric code", () => {
    const code = generateVerificationCode();

    expect(code).toMatch(/^[0-9]{6}$/);
  });

  it("hashes and verifies a code", async () => {
    const hash = await hashVerificationCode("483921");

    expect(hash).not.toBe("483921");
    await expect(verifyVerificationCode("483921", hash)).resolves.toBe(true);
    await expect(verifyVerificationCode("111111", hash)).resolves.toBe(false);
  });

  it("detects expired codes", () => {
    const now = new Date("2026-06-23T12:00:00.000Z");
    const expiresAt = createCodeExpiry(now);

    expect(expiresAt.toISOString()).toBe("2026-06-23T12:10:00.000Z");
    expect(isCodeExpired(expiresAt, new Date("2026-06-23T12:09:59.000Z"))).toBe(false);
    expect(isCodeExpired(expiresAt, new Date("2026-06-23T12:10:00.000Z"))).toBe(true);
  });
});
