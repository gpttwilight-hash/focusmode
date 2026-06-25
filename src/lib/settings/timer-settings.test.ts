import { describe, expect, it } from "vitest";
import {
  DEFAULT_TIMER_DURATIONS,
  normalizeTimerSettings,
  toTimerDurations,
} from "./timer-settings";

describe("timer settings", () => {
  it("normalizes profile values into safe timer durations", () => {
    const settings = normalizeTimerSettings({
      focusDurationSeconds: 60 * 60,
      shortBreakDurationSeconds: 8 * 60,
      longBreakDurationSeconds: 20 * 60,
    });

    expect(toTimerDurations(settings)).toEqual({
      focus: 60 * 60,
      short_break: 8 * 60,
      long_break: 20 * 60,
    });
  });

  it("falls back to defaults for invalid values", () => {
    const settings = normalizeTimerSettings({
      focusDurationSeconds: 5,
      shortBreakDurationSeconds: 0,
      longBreakDurationSeconds: 999999,
    });

    expect(toTimerDurations(settings)).toEqual(DEFAULT_TIMER_DURATIONS);
  });
});
