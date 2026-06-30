import { describe, expect, it } from "vitest";
import {
  COUNTDOWN_ALERT_SECONDS,
  getTimerAlertCue,
  type TimerAlertState,
} from "./timer-alerts";

describe("getTimerAlertCue", () => {
  const baseState: TimerAlertState = {
    lastCountdownSecond: null,
    completionPlayed: false,
  };

  it("plays a countdown cue once for each of the final five running seconds", () => {
    expect(
      getTimerAlertCue({
        status: "running",
        secondsRemaining: COUNTDOWN_ALERT_SECONDS,
        state: baseState,
      })
    ).toBe("countdown");

    expect(
      getTimerAlertCue({
        status: "running",
        secondsRemaining: COUNTDOWN_ALERT_SECONDS,
        state: { ...baseState, lastCountdownSecond: COUNTDOWN_ALERT_SECONDS },
      })
    ).toBeNull();

    expect(
      getTimerAlertCue({
        status: "running",
        secondsRemaining: 4,
        state: { ...baseState, lastCountdownSecond: COUNTDOWN_ALERT_SECONDS },
      })
    ).toBe("countdown");
  });

  it("does not play countdown cues outside active countdown seconds", () => {
    expect(
      getTimerAlertCue({
        status: "running",
        secondsRemaining: COUNTDOWN_ALERT_SECONDS + 1,
        state: baseState,
      })
    ).toBeNull();

    expect(
      getTimerAlertCue({
        status: "paused",
        secondsRemaining: 3,
        state: baseState,
      })
    ).toBeNull();
  });

  it("plays the completion cue once when the timer completes", () => {
    expect(
      getTimerAlertCue({
        status: "complete",
        secondsRemaining: 0,
        state: baseState,
      })
    ).toBe("complete");

    expect(
      getTimerAlertCue({
        status: "complete",
        secondsRemaining: 0,
        state: { ...baseState, completionPlayed: true },
      })
    ).toBeNull();
  });
});
