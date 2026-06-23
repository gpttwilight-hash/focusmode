import { describe, expect, it } from "vitest";
import { createSessionToken, hashSessionToken, verifySessionToken } from "./session-token";

describe("session token helpers", () => {
  it("creates a signed token and verifies it", async () => {
    const secret = "test-secret-with-enough-length-for-hmac";
    const token = await createSessionToken({
      secret,
      sessionId: "session-1",
      userId: "user-1",
      expiresAt: new Date("2026-06-24T00:00:00.000Z"),
    });

    const payload = await verifySessionToken(token, secret);

    expect(payload.sessionId).toBe("session-1");
    expect(payload.userId).toBe("user-1");
    expect(payload.expiresAt).toBe("2026-06-24T00:00:00.000Z");
  });

  it("hashes token values for database storage", async () => {
    const hash = await hashSessionToken("raw-token");

    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hash).not.toBe("raw-token");
  });
});
