export type VerifiedGoogleProfile = {
  subject: string;
  email: string;
};

export function toVerifiedGoogleProfile(payload: unknown): VerifiedGoogleProfile {
  if (!payload || typeof payload !== "object") {
    throw new Error("Google profile is invalid.");
  }

  const profile = payload as Record<string, unknown>;
  const subject = profile.sub;
  const email = profile.email;
  const emailVerified = profile.email_verified;

  if (typeof subject !== "string" || !subject) {
    throw new Error("Google profile is missing a subject.");
  }

  if (typeof email !== "string" || !email.includes("@")) {
    throw new Error("Google profile is missing an email.");
  }

  if (emailVerified !== true) {
    throw new Error("Google email is not verified.");
  }

  return {
    subject,
    email: email.trim().toLowerCase(),
  };
}
