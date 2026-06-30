import { describe, expect, it } from "vitest";
import { mergeSessions, parseImportedSessions, type Session } from "./session-store";

const baseSession: Session = {
  id: "session-1",
  label: "Focus",
  mode: "focus",
  plannedDuration: 1500,
  actualDuration: 1200,
  startedAt: new Date("2026-06-30T10:00:00.000Z"),
  endedAt: new Date("2026-06-30T10:20:00.000Z"),
  completed: true,
  interrupted: false,
  synced: false,
};

describe("session history import", () => {
  it("parses valid imported sessions and skips invalid entries", () => {
    const sessions = parseImportedSessions([
      {
        ...baseSession,
        startedAt: baseSession.startedAt.toISOString(),
        endedAt: baseSession.endedAt.toISOString(),
      },
      {
        id: "broken",
        mode: "wrong",
      },
    ]);

    expect(sessions).toHaveLength(1);
    expect(sessions[0]).toMatchObject({
      id: "session-1",
      mode: "focus",
      actualDuration: 1200,
    });
    expect(sessions[0].startedAt).toEqual(baseSession.startedAt);
  });

  it("merges imported sessions without duplicating existing ids", () => {
    const imported = {
      ...baseSession,
      id: "session-2",
      startedAt: new Date("2026-06-30T11:00:00.000Z"),
      endedAt: new Date("2026-06-30T11:20:00.000Z"),
    };

    expect(mergeSessions([baseSession], [baseSession, imported]).map((session) => session.id)).toEqual([
      "session-1",
      "session-2",
    ]);
  });
});
