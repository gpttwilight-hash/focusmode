import { describe, expect, it } from "vitest";
import { getEmailProviderKind } from "./config";

describe("email provider config", () => {
  it("uses resend when resend credentials are present", () => {
    expect(
      getEmailProviderKind({
        RESEND_API_KEY: "re_test",
        EMAIL_FROM: "FocusFlow <hello@example.com>",
        BREVO_API_KEY: "xkeysib-test",
      })
    ).toBe("resend");
  });

  it("uses brevo when brevo credentials are present and resend is absent", () => {
    expect(
      getEmailProviderKind({
        EMAIL_FROM: "FocusFlow <hello@example.com>",
        BREVO_API_KEY: "xkeysib-test",
      })
    ).toBe("brevo");
  });

  it("uses dev logging when no real provider is configured", () => {
    expect(getEmailProviderKind({})).toBe("dev");
  });
});
