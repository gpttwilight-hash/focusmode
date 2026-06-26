import type { CurrentUser } from "./current-user";

export type PublicProfile = {
  email: string;
  emailVerified: boolean;
};

export function toPublicProfile(user: CurrentUser): PublicProfile {
  return {
    email: user.email,
    emailVerified: user.emailVerifiedAt !== null,
  };
}
