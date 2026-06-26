import { getCurrentUser } from "@/lib/auth/current-user";
import { toPublicProfile } from "@/lib/auth/public-profile";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(toPublicProfile(user));
}
