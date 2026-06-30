import { db } from "@/db/client";
import { activeTimers } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/current-user";
import {
  applyActiveTimerMutation,
  normalizeActiveTimerInput,
  parseActiveTimerMutation,
  type ActiveTimerState,
} from "@/lib/timer/active-timer";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

type ActiveTimerRow = typeof activeTimers.$inferSelect;

function stateFromRow(row: ActiveTimerRow | undefined): ActiveTimerState {
  if (!row) return normalizeActiveTimerInput({});

  return normalizeActiveTimerInput({
    mode: row.mode,
    status: row.status,
    sessionLabel: row.sessionLabel,
    plannedDuration: row.plannedDuration,
    activeElapsedSeconds: row.activeElapsedSeconds,
    sessionStartedAt: row.sessionStartedAt,
    runStartedAt: row.runStartedAt,
    completedAt: row.completedAt,
    version: row.version,
    updatedAt: row.updatedAt,
  });
}

function serializeState(state: ActiveTimerState) {
  return {
    ...state,
    sessionStartedAt: state.sessionStartedAt?.toISOString() ?? null,
    runStartedAt: state.runStartedAt?.toISOString() ?? null,
    completedAt: state.completedAt?.toISOString() ?? null,
    updatedAt: state.updatedAt?.toISOString() ?? null,
  };
}

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const timer = await db.query.activeTimers.findFirst({
    where: eq(activeTimers.userId, user.id),
  });

  return NextResponse.json(serializeState(stateFromRow(timer)));
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

  const mutation = parseActiveTimerMutation(body);
  if (!mutation) {
    return NextResponse.json({ error: "Invalid timer mutation" }, { status: 400 });
  }

  const existing = await db.query.activeTimers.findFirst({
    where: eq(activeTimers.userId, user.id),
  });
  const now = new Date();
  const next = applyActiveTimerMutation(stateFromRow(existing), mutation, now);

  const [saved] = await db
    .insert(activeTimers)
    .values({
      userId: user.id,
      mode: next.mode,
      status: next.status,
      sessionLabel: next.sessionLabel,
      plannedDuration: next.plannedDuration,
      activeElapsedSeconds: next.activeElapsedSeconds,
      sessionStartedAt: next.sessionStartedAt,
      runStartedAt: next.runStartedAt,
      completedAt: next.completedAt,
      version: next.version,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: activeTimers.userId,
      set: {
        mode: next.mode,
        status: next.status,
        sessionLabel: next.sessionLabel,
        plannedDuration: next.plannedDuration,
        activeElapsedSeconds: next.activeElapsedSeconds,
        sessionStartedAt: next.sessionStartedAt,
        runStartedAt: next.runStartedAt,
        completedAt: next.completedAt,
        version: next.version,
        updatedAt: now,
      },
    })
    .returning();

  return NextResponse.json(serializeState(stateFromRow(saved)));
}
