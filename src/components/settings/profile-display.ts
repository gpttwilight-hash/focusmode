import type { PublicProfile } from "@/lib/auth/public-profile";

export type ProfileStatus = "loading" | "ready" | "signed-out" | "error";

export function getProfileEmailText(status: ProfileStatus, profile: PublicProfile | null) {
  if (status === "ready" && profile) return profile.email;
  if (status === "loading") return "Loading profile...";
  if (status === "signed-out") return "Not signed in";

  return "Could not load profile";
}
