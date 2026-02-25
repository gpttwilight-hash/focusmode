import { create } from "zustand";

export type TimerMode = "focus" | "short_break" | "long_break";
export type TimerStatus = "idle" | "running" | "paused" | "complete";

interface TimerStore {
  mode: TimerMode;
  status: TimerStatus;
  secondsRemaining: number;
  plannedDuration: number;
  sessionLabel: string;
  sessionStartedAt: Date | null;
  completedPomodoros: number;

  customDurations: Record<TimerMode, number>;

  setMode: (mode: TimerMode) => void;
  setCustomDuration: (mode: TimerMode, seconds: number) => void;
  setLabel: (label: string) => void;
  setSecondsRemaining: (s: number) => void;
  start: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  reset: () => void;
  markComplete: () => void;
}

const DEFAULT_DURATIONS: Record<TimerMode, number> = {
  focus: 25 * 60,
  short_break: 5 * 60,
  long_break: 15 * 60,
};

export const useTimerStore = create<TimerStore>((set, get) => ({
  mode: "focus",
  status: "idle",
  secondsRemaining: DEFAULT_DURATIONS.focus,
  plannedDuration: DEFAULT_DURATIONS.focus,
  sessionLabel: "",
  sessionStartedAt: null,
  completedPomodoros: 0,
  customDurations: { ...DEFAULT_DURATIONS },

  setMode: (mode) => {
    const { status, customDurations } = get();
    if (status === "running" || status === "paused") return;
    const duration = customDurations[mode];
    set({ mode, secondsRemaining: duration, plannedDuration: duration, status: "idle" });
  },

  setCustomDuration: (mode, seconds) => {
    const { customDurations, mode: currentMode, status } = get();
    const updated = { ...customDurations, [mode]: seconds };
    set({ customDurations: updated });
    if (mode === currentMode && (status === "idle")) {
      set({ secondsRemaining: seconds, plannedDuration: seconds });
    }
  },

  setLabel: (label) => set({ sessionLabel: label }),

  setSecondsRemaining: (s) => set({ secondsRemaining: s }),

  start: () => {
    const { customDurations, mode } = get();
    const duration = customDurations[mode];
    set({
      status: "running",
      secondsRemaining: duration,
      plannedDuration: duration,
      sessionStartedAt: new Date(),
    });
  },

  pause: () => {
    if (get().status === "running") set({ status: "paused" });
  },

  resume: () => {
    if (get().status === "paused") set({ status: "running" });
  },

  stop: () => {
    const { customDurations, mode } = get();
    set({
      status: "idle",
      secondsRemaining: customDurations[mode],
      sessionStartedAt: null,
    });
  },

  reset: () => {
    const { customDurations, mode } = get();
    set({
      status: "idle",
      secondsRemaining: customDurations[mode],
      plannedDuration: customDurations[mode],
      sessionStartedAt: null,
    });
  },

  markComplete: () => {
    const { mode, completedPomodoros } = get();
    set({
      status: "complete",
      secondsRemaining: 0,
      completedPomodoros: mode === "focus" ? completedPomodoros + 1 : completedPomodoros,
    });
  },
}));
