import { describe, expect, it } from "vitest";
import { getProfileEmailText, type ProfileStatus } from "./profile-display";

describe("profile display", () => {
  it("uses a clear signed-out label when no profile is available", () => {
    expect(getProfileEmailText("signed-out", null)).toBe("Not signed in");
  });

  it("shows the signed-in email when the profile is ready", () => {
    expect(
      getProfileEmailText("ready", {
        email: "sergey@example.com",
        emailVerified: true,
      })
    ).toBe("sergey@example.com");
  });
});
