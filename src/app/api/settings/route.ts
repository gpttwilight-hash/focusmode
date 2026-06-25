import { db } from "@/db/client";
import { userSettings } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/current-user";
import {
  normalizeTimerSettings,
  type ProfileTimerSettings,
} from "@/lib/settings/timer-settings";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await db.query.userSettings.findFirst({
    where: eq(userSettings.userId, user.id),
  });

  return NextResponse.json(
    normalizeTimerSettings({
      focusDurationSeconds: settings?.focusDurationSeconds,
      shortBreakDurationSeconds: settings?.shortBreakDurationSeconds,
      longBreakDurationSeconds: settings?.longBreakDurationSeconds,
    })
  );
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Partial<ProfileTimerSettings>;

  try {
    body = (await request.json()) as Partial<ProfileTimerSettings>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const settings = normalizeTimerSettings(body);

  const [saved] = await db
    .insert(userSettings)
    .values({
      userId: user.id,
      ...settings,
    })
    .onConflictDoUpdate({
      target: userSettings.userId,
      set: {
        ...settings,
        updatedAt: new Date(),
      },
    })
    .returning();

  return NextResponse.json(
    normalizeTimerSettings({
      focusDurationSeconds: saved.focusDurationSeconds,
      shortBreakDurationSeconds: saved.shortBreakDurationSeconds,
      longBreakDurationSeconds: saved.longBreakDurationSeconds,
    })
  );
}
