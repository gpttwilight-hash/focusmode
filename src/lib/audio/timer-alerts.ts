import type { TimerStatus } from "@/lib/store/timer-store";

export const COUNTDOWN_ALERT_SECONDS = 5;

export type TimerAlertCue = "countdown" | "complete";

export type TimerAlertState = {
  lastCountdownSecond: number | null;
  completionPlayed: boolean;
};

type GetTimerAlertCueInput = {
  status: TimerStatus;
  secondsRemaining: number;
  state: TimerAlertState;
};

type AudioContextConstructor = new () => AudioContext;

type WindowWithWebAudio = Window &
  typeof globalThis & {
    webkitAudioContext?: AudioContextConstructor;
  };

let audioContext: AudioContext | null = null;

export function createInitialTimerAlertState(): TimerAlertState {
  return {
    lastCountdownSecond: null,
    completionPlayed: false,
  };
}

export function getTimerAlertCue({
  status,
  secondsRemaining,
  state,
}: GetTimerAlertCueInput): TimerAlertCue | null {
  if (status === "complete") {
    return state.completionPlayed ? null : "complete";
  }

  if (status !== "running") return null;
  if (secondsRemaining < 1 || secondsRemaining > COUNTDOWN_ALERT_SECONDS) return null;
  if (state.lastCountdownSecond === secondsRemaining) return null;

  return "countdown";
}

export async function primeTimerAlertAudio() {
  const context = getAudioContext();
  if (!context) return;

  await resumeAudioContext(context);
}

export async function playTimerAlertCue(cue: TimerAlertCue) {
  const context = getAudioContext();
  if (!context) return;

  await resumeAudioContext(context);
  if (context.state !== "running") return;

  if (cue === "countdown") {
    playTone(context, {
      frequency: 640,
      duration: 0.085,
      peakGain: 0.045,
      type: "sine",
    });
    return;
  }

  playCompletionChime(context);
}

function getAudioContext() {
  if (typeof window === "undefined") return null;
  if (audioContext) return audioContext;

  const audioWindow = window as WindowWithWebAudio;
  const Context = audioWindow.AudioContext ?? audioWindow.webkitAudioContext;
  if (!Context) return null;

  audioContext = new Context();
  return audioContext;
}

async function resumeAudioContext(context: AudioContext) {
  if (context.state !== "suspended") return;

  try {
    await context.resume();
  } catch {
    // Browsers may still block audio until a user gesture. The next timer action will retry.
  }
}

function playCompletionChime(context: AudioContext) {
  const now = context.currentTime;
  const notes = [
    { frequency: 523.25, delay: 0 },
    { frequency: 659.25, delay: 0.09 },
    { frequency: 783.99, delay: 0.18 },
  ];

  for (const note of notes) {
    playTone(context, {
      frequency: note.frequency,
      duration: 0.48,
      delay: note.delay,
      peakGain: 0.035,
      type: "triangle",
      startTime: now,
    });
  }
}

function playTone(
  context: AudioContext,
  {
    frequency,
    duration,
    peakGain,
    type,
    delay = 0,
    startTime = context.currentTime,
  }: {
    frequency: number;
    duration: number;
    peakGain: number;
    type: OscillatorType;
    delay?: number;
    startTime?: number;
  }
) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const startsAt = startTime + delay;
  const endsAt = startsAt + duration;

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startsAt);

  gain.gain.setValueAtTime(0.0001, startsAt);
  gain.gain.exponentialRampToValueAtTime(peakGain, startsAt + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001, endsAt);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(startsAt);
  oscillator.stop(endsAt + 0.02);
}
