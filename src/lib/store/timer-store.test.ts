import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_TIMER_DURATIONS } from "@/lib/settings/timer-settings";
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
});
