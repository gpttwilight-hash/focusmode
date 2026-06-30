import { describe, expect, it } from "vitest";
import {
  mergeSessionHistory,
  normalizeSessionHistoryPayload,
  serializeSession,
  type Session,
} from "./session-history";

const session: Session = {
  id: "session-1",
  label: "Deep work",
  mode: "focus",
  plannedDuration: 1500,
  actualDuration: 1490,
  startedAt: new Date("2026-06-29T10:00:00.000Z"),
  endedAt: new Date("2026-06-29T10:24:50.000Z"),
  completed: true,
  interrupted: false,
  synced: false,
};

describe("session history sync helpers", () => {
  it("normalizes cloud history payloads and ignores invalid sessions", () => {
    const sessions = normalizeSessionHistoryPayload([
      {
        ...serializeSession(session),
        userId: "client-side-user-id-is-ignored",
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
      completed: true,
      synced: true,
    });
    expect(sessions[0].userId).toBeUndefined();
    expect(sessions[0].startedAt).toEqual(session.startedAt);
  });

  it("merges cloud and local sessions in chronological order", () => {
    const newerSession = {
      ...session,
      id: "session-2",
      startedAt: new Date("2026-06-30T10:00:00.000Z"),
      endedAt: new Date("2026-06-30T10:25:00.000Z"),
    };

    expect(mergeSessionHistory([newerSession], [session, newerSession]).map((item) => item.id)).toEqual([
      "session-1",
      "session-2",
    ]);
  });
});
