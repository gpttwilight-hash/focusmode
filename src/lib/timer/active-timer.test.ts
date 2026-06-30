import { describe, expect, it } from "vitest";
import {
  applyActiveTimerMutation,
  calculateActiveElapsedSeconds,
  calculateSecondsRemaining,
  normalizeActiveTimerInput,
  parseActiveTimerMutation,
} from "./active-timer";

describe("active timer normalization", () => {
  it("normalizes invalid input to an idle focus timer", () => {
    const state = normalizeActiveTimerInput({
      mode: "wrong",
      status: "strange",
      plannedDuration: 10,
      activeElapsedSeconds: -4,
      runStartedAt: "not-a-date",
    });

    expect(state).toMatchObject({
      mode: "focus",
      status: "idle",
      plannedDuration: 25 * 60,
      activeElapsedSeconds: 0,
      sessionLabel: "",
      runStartedAt: null,
      version: 0,
    });
  });

  it("calculates remaining time from absolute run start", () => {
    const state = normalizeActiveTimerInput({
      mode: "focus",
      status: "running",
      plannedDuration: 900,
      activeElapsedSeconds: 120,
      sessionStartedAt: "2026-06-30T09:00:00.000Z",
      runStartedAt: "2026-06-30T09:02:00.000Z",
    });

    const now = new Date("2026-06-30T09:05:00.000Z");

    expect(calculateActiveElapsedSeconds(state, now)).toBe(300);
    expect(calculateSecondsRemaining(state, now)).toBe(600);
  });
});

describe("active timer mutations", () => {
  it("parses safe client mutations and rejects unknown commands", () => {
    expect(
      parseActiveTimerMutation({
        type: "start",
        mode: "focus",
        plannedDuration: 1500,
        sessionLabel: "Read paper",
      })
    ).toEqual({
      type: "start",
      mode: "focus",
      plannedDuration: 1500,
      sessionLabel: "Read paper",
    });

    expect(parseActiveTimerMutation({ type: "launch" })).toBeNull();
    expect(parseActiveTimerMutation(null)).toBeNull();
  });

  it("starts, pauses, resumes, and completes with server timestamps", () => {
    const idle = normalizeActiveTimerInput({});
    const startedAt = new Date("2026-06-30T09:00:00.000Z");
    const pausedAt = new Date("2026-06-30T09:10:00.000Z");
    const resumedAt = new Date("2026-06-30T09:20:00.000Z");
    const completedAt = new Date("2026-06-30T09:45:00.000Z");

    const running = applyActiveTimerMutation(
      idle,
      {
        type: "start",
        mode: "focus",
        plannedDuration: 1800,
        sessionLabel: "Write proposal",
      },
      startedAt
    );

    expect(running).toMatchObject({
      status: "running",
      plannedDuration: 1800,
      activeElapsedSeconds: 0,
      sessionStartedAt: startedAt,
      runStartedAt: startedAt,
      version: 1,
    });

    const paused = applyActiveTimerMutation(running, { type: "pause" }, pausedAt);
    expect(paused.status).toBe("paused");
    expect(paused.activeElapsedSeconds).toBe(600);
    expect(paused.runStartedAt).toBeNull();
    expect(paused.version).toBe(2);

    const resumed = applyActiveTimerMutation(paused, { type: "resume" }, resumedAt);
    expect(resumed.status).toBe("running");
    expect(resumed.activeElapsedSeconds).toBe(600);
    expect(resumed.runStartedAt).toEqual(resumedAt);
    expect(resumed.version).toBe(3);

    const complete = applyActiveTimerMutation(resumed, { type: "complete" }, completedAt);
    expect(complete.status).toBe("complete");
    expect(complete.activeElapsedSeconds).toBe(1800);
    expect(complete.secondsRemaining).toBe(0);
    expect(complete.completedAt).toEqual(completedAt);
    expect(complete.version).toBe(4);
  });
});
