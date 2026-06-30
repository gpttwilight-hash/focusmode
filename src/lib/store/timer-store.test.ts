import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_TIMER_DURATIONS } from "@/lib/settings/timer-settings";
import { normalizeActiveTimerInput } from "@/lib/timer/active-timer";
import { useTimerStore } from "./timer-store";

function resetTimerStore() {
  useTimerStore.setState({
    mode: "focus",
    status: "idle",
    secondsRemaining: DEFAULT_TIMER_DURATIONS.focus,
    plannedDuration: DEFAULT_TIMER_DURATIONS.focus,
    sessionLabel: "",
    sessionStartedAt: null,
    activeElapsedSeconds: 0,
    runStartedAt: null,
    completedPomodoros: 0,
    desktopNotificationsEnabled: false,
    customDurations: { ...DEFAULT_TIMER_DURATIONS },
    syncVersion: 0,
    syncUpdatedAt: null,
  });
}

describe("timer active time tracking", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-30T09:00:00.000Z"));
    resetTimerStore();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("restores a running timer from the saved run start time after a refresh", () => {
    useTimerStore.setState({
      status: "running",
      plannedDuration: 600,
      secondsRemaining: 600,
      activeElapsedSeconds: 0,
      runStartedAt: new Date("2026-06-30T08:58:00.000Z"),
      sessionStartedAt: new Date("2026-06-30T08:58:00.000Z"),
    });

    useTimerStore.getState().syncRunningTime();

    expect(useTimerStore.getState().secondsRemaining).toBe(480);
    expect(useTimerStore.getState().getActiveElapsedSeconds()).toBe(120);
  });

  it("excludes paused wall-clock time from the active session duration", () => {
    useTimerStore.getState().setCustomDuration("focus", 90 * 60);
    useTimerStore.getState().start();

    vi.setSystemTime(new Date("2026-06-30T09:30:00.000Z"));
    useTimerStore.getState().pause();

    vi.setSystemTime(new Date("2026-06-30T12:30:00.000Z"));
    useTimerStore.getState().resume();

    vi.setSystemTime(new Date("2026-06-30T13:30:00.000Z"));
    useTimerStore.getState().syncRunningTime();

    expect(useTimerStore.getState().status).toBe("complete");
    expect(useTimerStore.getState().getActiveElapsedSeconds()).toBe(90 * 60);
    expect(useTimerStore.getState().secondsRemaining).toBe(0);
  });

  it("applies newer remote timer state and ignores stale remote state", () => {
    const remote = normalizeActiveTimerInput({
      mode: "focus",
      status: "running",
      plannedDuration: 900,
      activeElapsedSeconds: 120,
      runStartedAt: "2026-06-30T09:00:00.000Z",
      sessionStartedAt: "2026-06-30T09:00:00.000Z",
      version: 2,
      updatedAt: "2026-06-30T09:00:00.000Z",
    });

    expect(useTimerStore.getState().applyRemoteTimerState(remote)).toBe(true);
    expect(useTimerStore.getState().status).toBe("running");
    expect(useTimerStore.getState().syncVersion).toBe(2);

    const stale = normalizeActiveTimerInput({
      ...remote,
      status: "paused",
      version: 1,
      updatedAt: "2026-06-30T09:10:00.000Z",
    });

    expect(useTimerStore.getState().applyRemoteTimerState(stale)).toBe(false);
    expect(useTimerStore.getState().status).toBe("running");
  });

  it("can force a matching remote version to repair persisted elapsed time", () => {
    useTimerStore.setState({
      status: "running",
      plannedDuration: 900,
      secondsRemaining: 420,
      activeElapsedSeconds: 300,
      runStartedAt: new Date("2026-06-30T09:02:00.000Z"),
      sessionStartedAt: new Date("2026-06-30T09:00:00.000Z"),
      syncVersion: 5,
      syncUpdatedAt: new Date("2026-06-30T09:02:00.000Z"),
    });

    vi.setSystemTime(new Date("2026-06-30T09:05:00.000Z"));

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

    expect(useTimerStore.getState().applyRemoteTimerState(remote, { force: true })).toBe(true);
    expect(useTimerStore.getState().activeElapsedSeconds).toBe(120);
    expect(useTimerStore.getState().secondsRemaining).toBe(600);
  });
});
