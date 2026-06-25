import { describe, expect, it } from "vitest";
import { toVerifiedGoogleProfile } from "./google-profile";

describe("google oauth profile", () => {
  it("accepts a verified Google email profile", () => {
    expect(
      toVerifiedGoogleProfile({
        sub: "google-subject",
        email: "User@Example.COM",
        email_verified: true,
      })
    ).toEqual({
      subject: "google-subject",
      email: "user@example.com",
    });
  });

  it("rejects Google profiles without a verified email", () => {
    expect(() =>
      toVerifiedGoogleProfile({
        sub: "google-subject",
        email: "user@example.com",
        email_verified: false,
      })
    ).toThrow("Google email is not verified.");
  });
});
