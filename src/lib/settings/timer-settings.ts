import type { TimerMode } from "@/lib/store/timer-store";

export type ProfileTimerSettings = {
  focusDurationSeconds: number;
  shortBreakDurationSeconds: number;
  longBreakDurationSeconds: number;
};

export const DEFAULT_TIMER_DURATIONS: Record<TimerMode, number> = {
  focus: 25 * 60,
  short_break: 5 * 60,
  long_break: 15 * 60,
};

const LIMITS: Record<keyof ProfileTimerSettings, { min: number; max: number; fallback: number }> = {
  focusDurationSeconds: {
    min: 10 * 60,
    max: 90 * 60,
    fallback: DEFAULT_TIMER_DURATIONS.focus,
  },
  shortBreakDurationSeconds: {
    min: 1 * 60,
    max: 15 * 60,
    fallback: DEFAULT_TIMER_DURATIONS.short_break,
  },
  longBreakDurationSeconds: {
    min: 5 * 60,
    max: 30 * 60,
    fallback: DEFAULT_TIMER_DURATIONS.long_break,
  },
};

function normalizeSeconds(value: unknown, limit: { min: number; max: number; fallback: number }) {
  if (typeof value !== "number" || !Number.isFinite(value)) return limit.fallback;

  const rounded = Math.round(value);
  if (rounded < limit.min || rounded > limit.max) return limit.fallback;
  return rounded;
}

export function normalizeTimerSettings(input: Partial<ProfileTimerSettings>): ProfileTimerSettings {
  return {
    focusDurationSeconds: normalizeSeconds(
      input.focusDurationSeconds,
      LIMITS.focusDurationSeconds
    ),
    shortBreakDurationSeconds: normalizeSeconds(
      input.shortBreakDurationSeconds,
      LIMITS.shortBreakDurationSeconds
    ),
    longBreakDurationSeconds: normalizeSeconds(
      input.longBreakDurationSeconds,
      LIMITS.longBreakDurationSeconds
    ),
  };
}

export function toTimerDurations(settings: ProfileTimerSettings): Record<TimerMode, number> {
  return {
    focus: settings.focusDurationSeconds,
    short_break: settings.shortBreakDurationSeconds,
    long_break: settings.longBreakDurationSeconds,
  };
}

export function toProfileTimerSettings(
  durations: Record<TimerMode, number>
): ProfileTimerSettings {
  return normalizeTimerSettings({
    focusDurationSeconds: durations.focus,
    shortBreakDurationSeconds: durations.short_break,
    longBreakDurationSeconds: durations.long_break,
  });
}
