import { describe, expect, it } from "vitest";
import { normalizeActiveTimerInput } from "./active-timer";
import { shouldApplyRemoteTimerState, toTimerStorePatch } from "./timer-sync";

describe("timer sync", () => {
  it("applies newer remote timer versions and ignores stale versions", () => {
    const local = normalizeActiveTimerInput({
      status: "running",
      version: 3,
      updatedAt: "2026-06-30T09:10:00.000Z",
    });
    const stale = normalizeActiveTimerInput({
      status: "paused",
      version: 2,
      updatedAt: "2026-06-30T09:20:00.000Z",
    });
    const newer = normalizeActiveTimerInput({
      status: "paused",
      version: 4,
      updatedAt: "2026-06-30T09:15:00.000Z",
    });

    expect(shouldApplyRemoteTimerState({ local, remote: stale })).toBe(false);
    expect(shouldApplyRemoteTimerState({ local, remote: newer })).toBe(true);
  });

  it("converts a running remote timer into a current store patch", () => {
    const remote = normalizeActiveTimerInput({
      mode: "focus",
      status: "running",
      plannedDuration: 900,
      activeElapsedSeconds: 120,
      runStartedAt: "2026-06-30T09:02:00.000Z",
      sessionStartedAt: "2026-06-30T09:00:00.000Z",
      version: 5,
      updatedAt: "2026-06-30T09:02:00.000Z",
    });

    expect(toTimerStorePatch(remote, new Date("2026-06-30T09:05:00.000Z"))).toMatchObject({
      mode: "focus",
      status: "running",
      plannedDuration: 900,
      activeElapsedSeconds: 300,
      secondsRemaining: 600,
      syncVersion: 5,
    });
  });
});
