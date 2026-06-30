import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { DEFAULT_TIMER_DURATIONS } from "@/lib/settings/timer-settings";
import type { ActiveTimerState } from "@/lib/timer/active-timer";
import { shouldApplyRemoteTimerState, toTimerStorePatch } from "@/lib/timer/timer-sync";

export type TimerMode = "focus" | "short_break" | "long_break";
export type TimerStatus = "idle" | "running" | "paused" | "complete";

interface TimerStore {
  mode: TimerMode;
  status: TimerStatus;
  secondsRemaining: number;
  plannedDuration: number;
  sessionLabel: string;
  sessionStartedAt: Date | null;
  activeElapsedSeconds: number;
  runStartedAt: Date | null;
  completedPomodoros: number;
  desktopNotificationsEnabled: boolean;
  syncVersion: number;
  syncUpdatedAt: Date | null;

  customDurations: Record<TimerMode, number>;

  setMode: (mode: TimerMode) => void;
  setCustomDuration: (mode: TimerMode, seconds: number) => void;
  setCustomDurations: (durations: Record<TimerMode, number>) => void;
  setDesktopNotificationsEnabled: (enabled: boolean) => void;
  setLabel: (label: string) => void;
  setSecondsRemaining: (s: number) => void;
  getActiveElapsedSeconds: (now?: number) => number;
  syncRunningTime: (now?: number) => void;
  start: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  reset: () => void;
  markComplete: () => void;
  clearSavedSession: () => void;
  applyRemoteTimerState: (remoteState: ActiveTimerState) => boolean;
}

function secondsBetween(start: Date, now: number) {
  return Math.max(0, Math.floor((now - start.getTime()) / 1000));
}

function reviveTimerDate(key: string, value: unknown) {
  if (key !== "sessionStartedAt" && key !== "runStartedAt" && key !== "syncUpdatedAt") {
    return value;
  }
  if (typeof value !== "string") return value;

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? value : new Date(timestamp);
}

export const useTimerStore = create<TimerStore>()(
  persist(
    (set, get) => ({
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
  syncVersion: 0,
  syncUpdatedAt: null,
  customDurations: { ...DEFAULT_TIMER_DURATIONS },

  setMode: (mode) => {
    const { status, customDurations } = get();
    if (status === "running" || status === "paused") return;
    const duration = customDurations[mode];
    set({
      mode,
      secondsRemaining: duration,
      plannedDuration: duration,
      status: "idle",
      activeElapsedSeconds: 0,
      runStartedAt: null,
    });
  },

  setCustomDuration: (mode, seconds) => {
    const { customDurations, mode: currentMode, status } = get();
    const updated = { ...customDurations, [mode]: seconds };
    set({ customDurations: updated });
    if (mode === currentMode && (status === "idle")) {
      set({ secondsRemaining: seconds, plannedDuration: seconds });
    }
  },

  setCustomDurations: (durations) => {
    const { mode, status } = get();
    set({ customDurations: durations });
    if (status === "idle") {
      set({
        secondsRemaining: durations[mode],
        plannedDuration: durations[mode],
      });
    }
  },

  setDesktopNotificationsEnabled: (enabled) => set({ desktopNotificationsEnabled: enabled }),

  setLabel: (label) => set({ sessionLabel: label }),

  setSecondsRemaining: (s) => set({ secondsRemaining: s }),

  getActiveElapsedSeconds: (now = Date.now()) => {
    const { status, activeElapsedSeconds, runStartedAt } = get();
    if (status !== "running" || !runStartedAt) return activeElapsedSeconds;

    return activeElapsedSeconds + secondsBetween(runStartedAt, now);
  },

  syncRunningTime: (now = Date.now()) => {
    const { status, plannedDuration, mode, completedPomodoros } = get();
    if (status !== "running") return;

    const activeElapsedSeconds = get().getActiveElapsedSeconds(now);
    const secondsRemaining = Math.max(0, plannedDuration - activeElapsedSeconds);

    if (secondsRemaining <= 0) {
      set({
        status: "complete",
        secondsRemaining: 0,
        activeElapsedSeconds: plannedDuration,
        runStartedAt: null,
        completedPomodoros: mode === "focus" ? completedPomodoros + 1 : completedPomodoros,
      });
      return;
    }

    set({ secondsRemaining });
  },

  start: () => {
    const { customDurations, mode } = get();
    const duration = customDurations[mode];
    const now = new Date();
    set({
      status: "running",
      secondsRemaining: duration,
      plannedDuration: duration,
      sessionStartedAt: now,
      activeElapsedSeconds: 0,
      runStartedAt: now,
    });
  },

  pause: () => {
    const { status, plannedDuration } = get();
    if (status !== "running") return;

    const activeElapsedSeconds = get().getActiveElapsedSeconds();
    set({
      status: "paused",
      activeElapsedSeconds,
      runStartedAt: null,
      secondsRemaining: Math.max(0, plannedDuration - activeElapsedSeconds),
    });
  },

  resume: () => {
    if (get().status === "paused") set({ status: "running", runStartedAt: new Date() });
  },

  stop: () => {
    const { customDurations, mode } = get();
    set({
      status: "idle",
      secondsRemaining: customDurations[mode],
      sessionStartedAt: null,
      activeElapsedSeconds: 0,
      runStartedAt: null,
    });
  },

  reset: () => {
    const { customDurations, mode } = get();
    set({
      status: "idle",
      secondsRemaining: customDurations[mode],
      plannedDuration: customDurations[mode],
      sessionStartedAt: null,
      activeElapsedSeconds: 0,
      runStartedAt: null,
    });
  },

  markComplete: () => {
    const { mode, completedPomodoros } = get();
    set({
      status: "complete",
      secondsRemaining: 0,
      activeElapsedSeconds: get().plannedDuration,
      runStartedAt: null,
      completedPomodoros: mode === "focus" ? completedPomodoros + 1 : completedPomodoros,
    });
  },

  clearSavedSession: () => {
    set({ sessionStartedAt: null, runStartedAt: null });
  },

  applyRemoteTimerState: (remoteState) => {
    const local = {
      version: get().syncVersion,
      updatedAt: get().syncUpdatedAt,
    };

    if (!shouldApplyRemoteTimerState({ local, remote: remoteState })) return false;

    set(toTimerStorePatch(remoteState));
    return true;
  },
    }),
    {
      name: "focusflow-timer-settings",
      storage: createJSONStorage(() => localStorage, { reviver: reviveTimerDate }),
      partialize: (state) => ({
        mode: state.mode,
        status: state.status,
        secondsRemaining: state.secondsRemaining,
        plannedDuration: state.plannedDuration,
        sessionLabel: state.sessionLabel,
        sessionStartedAt: state.sessionStartedAt,
        activeElapsedSeconds: state.activeElapsedSeconds,
        runStartedAt: state.runStartedAt,
        completedPomodoros: state.completedPomodoros,
        customDurations: state.customDurations,
        desktopNotificationsEnabled: state.desktopNotificationsEnabled,
        syncVersion: state.syncVersion,
        syncUpdatedAt: state.syncUpdatedAt,
      }),
    }
  )
);
