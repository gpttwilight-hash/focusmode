import { describe, expect, it } from "vitest";
import { toPublicProfile } from "./public-profile";

describe("public profile", () => {
  it("exposes the email needed to identify the signed-in account", () => {
    expect(
      toPublicProfile({
        id: "user-1",
        email: "sergey@example.com",
        emailVerifiedAt: new Date("2026-06-26T00:00:00.000Z"),
      })
    ).toEqual({
      email: "sergey@example.com",
      emailVerified: true,
    });
  });
});
