import { db } from "@/db/client";
import { focusSessions } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/current-user";
import {
  normalizeSessionHistoryPayload,
  serializeSession,
  type Session,
} from "@/lib/sessions/session-history";
import { asc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

type FocusSessionRow = typeof focusSessions.$inferSelect;

function sessionFromRow(row: FocusSessionRow): Session {
  return {
    id: row.clientSessionId,
    label: row.label,
    mode: row.mode === "short_break" || row.mode === "long_break" ? row.mode : "focus",
    plannedDuration: row.plannedDuration,
    actualDuration: row.actualDuration,
    startedAt: row.startedAt,
    endedAt: row.endedAt,
    completed: row.completed,
    interrupted: row.interrupted,
    audioTrackId: row.audioTrackId ?? undefined,
    synced: true,
  };
}

async function getUserSessions(userId: string) {
  const sessions = await db.query.focusSessions.findMany({
    where: eq(focusSessions.userId, userId),
    orderBy: asc(focusSessions.startedAt),
  });

  return sessions.map(sessionFromRow).map(serializeSession);
}

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(await getUserSessions(user.id));
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid session history" }, { status: 400 });
  }

  const incoming = normalizeSessionHistoryPayload(body).slice(0, 1000);
  const now = new Date();

  if (incoming.length > 0) {
    await db
      .insert(focusSessions)
      .values(
        incoming.map((session) => ({
          userId: user.id,
          clientSessionId: session.id,
          label: session.label,
          mode: session.mode,
          plannedDuration: session.plannedDuration,
          actualDuration: session.actualDuration,
          startedAt: session.startedAt,
          endedAt: session.endedAt,
          completed: session.completed,
          interrupted: session.interrupted,
          audioTrackId: session.audioTrackId,
          updatedAt: now,
        }))
      )
      .onConflictDoUpdate({
        target: [focusSessions.userId, focusSessions.clientSessionId],
        set: {
          label: sql`excluded.label`,
          mode: sql`excluded.mode`,
          plannedDuration: sql`excluded.planned_duration`,
          actualDuration: sql`excluded.actual_duration`,
          startedAt: sql`excluded.started_at`,
          endedAt: sql`excluded.ended_at`,
          completed: sql`excluded.completed`,
          interrupted: sql`excluded.interrupted`,
          audioTrackId: sql`excluded.audio_track_id`,
          updatedAt: now,
        },
      });
  }

  return NextResponse.json(await getUserSessions(user.id));
}
