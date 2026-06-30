export interface Session {
  id: string;
  userId?: string;
  label: string;
  mode: "focus" | "short_break" | "long_break";
  plannedDuration: number;
  actualDuration: number;
  startedAt: Date;
  endedAt: Date;
  completed: boolean;
  interrupted: boolean;
  audioTrackId?: string;
  synced: boolean;
}

export type SerializedSession = Omit<Session, "startedAt" | "endedAt"> & {
  startedAt: string;
  endedAt: string;
};

function isSessionMode(value: unknown): value is Session["mode"] {
  return value === "focus" || value === "short_break" || value === "long_break";
}

function parseSessionDate(value: unknown) {
  if (typeof value !== "string" && !(value instanceof Date)) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function normalizeSessionHistoryPayload(input: unknown): Session[] {
  if (!Array.isArray(input)) return [];

  return input.flatMap((item): Session[] => {
    if (!item || typeof item !== "object") return [];
    const session = item as Record<string, unknown>;
    const startedAt = parseSessionDate(session.startedAt);
    const endedAt = parseSessionDate(session.endedAt);

    if (
      typeof session.id !== "string" ||
      !isSessionMode(session.mode) ||
      typeof session.plannedDuration !== "number" ||
      typeof session.actualDuration !== "number" ||
      !startedAt ||
      !endedAt
    ) {
      return [];
    }

    return [
      {
        id: session.id,
        label: typeof session.label === "string" ? session.label : "",
        mode: session.mode,
        plannedDuration: Math.max(0, Math.round(session.plannedDuration)),
        actualDuration: Math.max(0, Math.round(session.actualDuration)),
        startedAt,
        endedAt,
        completed: session.completed === true,
        interrupted: session.interrupted === true,
        audioTrackId: typeof session.audioTrackId === "string" ? session.audioTrackId : undefined,
        synced: true,
      },
    ];
  });
}

export function serializeSession(session: Session): SerializedSession {
  return {
    ...session,
    startedAt: session.startedAt.toISOString(),
    endedAt: session.endedAt.toISOString(),
    synced: true,
  };
}

export function mergeSessionHistory(existing: Session[], incoming: Session[]) {
  const sessionsById = new Map(existing.map((session) => [session.id, session]));

  incoming.forEach((session) => {
    sessionsById.set(session.id, { ...session, synced: true });
  });

  return Array.from(sessionsById.values()).sort(
    (a, b) => a.startedAt.getTime() - b.startedAt.getTime()
  );
}
