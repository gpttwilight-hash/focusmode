import { DEFAULT_TIMER_DURATIONS } from "@/lib/settings/timer-settings";
import type { TimerMode, TimerStatus } from "@/lib/store/timer-store";

export type ActiveTimerState = {
  mode: TimerMode;
  status: TimerStatus;
  secondsRemaining: number;
  plannedDuration: number;
  sessionLabel: string;
  sessionStartedAt: Date | null;
  activeElapsedSeconds: number;
  runStartedAt: Date | null;
  completedAt: Date | null;
  version: number;
  updatedAt: Date | null;
};

export type ActiveTimerMutation =
  | {
      type: "start";
      mode?: TimerMode;
      plannedDuration?: number;
      sessionLabel?: string;
    }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "stop" }
  | { type: "reset"; mode?: TimerMode; plannedDuration?: number }
  | { type: "complete" }
  | { type: "label"; sessionLabel: string };

const TIMER_MODES: TimerMode[] = ["focus", "short_break", "long_break"];
const TIMER_STATUSES: TimerStatus[] = ["idle", "running", "paused", "complete"];

const DURATION_LIMITS: Record<TimerMode, { min: number; max: number }> = {
  focus: { min: 10 * 60, max: 90 * 60 },
  short_break: { min: 60, max: 15 * 60 },
  long_break: { min: 5 * 60, max: 30 * 60 },
};

type ActiveTimerInput = {
  mode?: unknown;
  status?: unknown;
  secondsRemaining?: unknown;
  plannedDuration?: unknown;
  sessionLabel?: unknown;
  activeElapsedSeconds?: unknown;
  sessionStartedAt?: unknown;
  runStartedAt?: unknown;
  completedAt?: unknown;
  version?: unknown;
  updatedAt?: unknown;
};

function isTimerMode(value: unknown): value is TimerMode {
  return typeof value === "string" && TIMER_MODES.includes(value as TimerMode);
}

function isTimerStatus(value: unknown): value is TimerStatus {
  return typeof value === "string" && TIMER_STATUSES.includes(value as TimerStatus);
}

function parseDate(value: unknown): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value !== "string") return null;

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : new Date(timestamp);
}

function normalizeDuration(mode: TimerMode, value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DEFAULT_TIMER_DURATIONS[mode];
  }

  const duration = Math.round(value);
  const limits = DURATION_LIMITS[mode];
  if (duration < limits.min || duration > limits.max) return DEFAULT_TIMER_DURATIONS[mode];

  return duration;
}

function normalizeElapsed(value: unknown, plannedDuration: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;

  return Math.min(plannedDuration, Math.max(0, Math.round(value)));
}

function normalizeVersion(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;

  return Math.max(0, Math.round(value));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseActiveTimerMutation(input: unknown): ActiveTimerMutation | null {
  if (!isRecord(input) || typeof input.type !== "string") return null;

  if (input.type === "start") {
    return {
      type: "start",
      mode: isTimerMode(input.mode) ? input.mode : undefined,
      plannedDuration:
        typeof input.plannedDuration === "number" && Number.isFinite(input.plannedDuration)
          ? Math.round(input.plannedDuration)
          : undefined,
      sessionLabel: typeof input.sessionLabel === "string" ? input.sessionLabel : undefined,
    };
  }

  if (input.type === "pause") return { type: "pause" };
  if (input.type === "resume") return { type: "resume" };
  if (input.type === "stop") return { type: "stop" };
  if (input.type === "complete") return { type: "complete" };

  if (input.type === "reset") {
    return {
      type: "reset",
      mode: isTimerMode(input.mode) ? input.mode : undefined,
      plannedDuration:
        typeof input.plannedDuration === "number" && Number.isFinite(input.plannedDuration)
          ? Math.round(input.plannedDuration)
          : undefined,
    };
  }

  if (input.type === "label" && typeof input.sessionLabel === "string") {
    return { type: "label", sessionLabel: input.sessionLabel };
  }

  return null;
}

export function calculateActiveElapsedSeconds(
  state: Pick<ActiveTimerState, "status" | "activeElapsedSeconds" | "runStartedAt">,
  now = new Date()
) {
  if (state.status !== "running" || !state.runStartedAt) return state.activeElapsedSeconds;

  const runningSeconds = Math.max(
    0,
    Math.floor((now.getTime() - state.runStartedAt.getTime()) / 1000)
  );

  return state.activeElapsedSeconds + runningSeconds;
}

export function calculateSecondsRemaining(
  state: Pick<
    ActiveTimerState,
    "status" | "plannedDuration" | "activeElapsedSeconds" | "runStartedAt"
  >,
  now = new Date()
) {
  return Math.max(0, state.plannedDuration - calculateActiveElapsedSeconds(state, now));
}

export function normalizeActiveTimerInput(input: ActiveTimerInput): ActiveTimerState {
  const mode = isTimerMode(input.mode) ? input.mode : "focus";
  const status = isTimerStatus(input.status) ? input.status : "idle";
  const plannedDuration = normalizeDuration(mode, input.plannedDuration);
  const activeElapsedSeconds = normalizeElapsed(input.activeElapsedSeconds, plannedDuration);
  const normalized: ActiveTimerState = {
    mode,
    status,
    plannedDuration,
    activeElapsedSeconds,
    secondsRemaining: 0,
    sessionLabel: typeof input.sessionLabel === "string" ? input.sessionLabel : "",
    sessionStartedAt: parseDate(input.sessionStartedAt),
    runStartedAt: status === "running" ? parseDate(input.runStartedAt) : null,
    completedAt: parseDate(input.completedAt),
    version: normalizeVersion(input.version),
    updatedAt: parseDate(input.updatedAt),
  };

  normalized.secondsRemaining = calculateSecondsRemaining(normalized);

  if (normalized.status === "idle") {
    normalized.secondsRemaining = normalized.plannedDuration;
    normalized.activeElapsedSeconds = 0;
    normalized.sessionStartedAt = null;
    normalized.runStartedAt = null;
    normalized.completedAt = null;
  }

  if (normalized.status === "complete") {
    normalized.secondsRemaining = 0;
    normalized.activeElapsedSeconds = normalized.plannedDuration;
    normalized.runStartedAt = null;
  }

  return normalized;
}

export function applyActiveTimerMutation(
  currentState: ActiveTimerState,
  mutation: ActiveTimerMutation,
  now = new Date()
): ActiveTimerState {
  const current = normalizeActiveTimerInput(currentState);
  const nextVersion = current.version + 1;

  if (mutation.type === "start") {
    const mode = mutation.mode ?? current.mode;
    const plannedDuration = normalizeDuration(mode, mutation.plannedDuration);

    return normalizeActiveTimerInput({
      mode,
      status: "running",
      plannedDuration,
      secondsRemaining: plannedDuration,
      sessionLabel: mutation.sessionLabel ?? current.sessionLabel,
      sessionStartedAt: now,
      activeElapsedSeconds: 0,
      runStartedAt: now,
      completedAt: null,
      version: nextVersion,
      updatedAt: now,
    });
  }

  if (mutation.type === "pause") {
    if (current.status !== "running") return { ...current, updatedAt: now, version: nextVersion };
    const activeElapsedSeconds = Math.min(
      current.plannedDuration,
      calculateActiveElapsedSeconds(current, now)
    );

    return normalizeActiveTimerInput({
      ...current,
      status: "paused",
      activeElapsedSeconds,
      runStartedAt: null,
      version: nextVersion,
      updatedAt: now,
    });
  }

  if (mutation.type === "resume") {
    if (current.status !== "paused") return { ...current, updatedAt: now, version: nextVersion };

    return normalizeActiveTimerInput({
      ...current,
      status: "running",
      runStartedAt: now,
      version: nextVersion,
      updatedAt: now,
    });
  }

  if (mutation.type === "complete") {
    return normalizeActiveTimerInput({
      ...current,
      status: "complete",
      secondsRemaining: 0,
      activeElapsedSeconds: current.plannedDuration,
      runStartedAt: null,
      completedAt: now,
      version: nextVersion,
      updatedAt: now,
    });
  }

  if (mutation.type === "label") {
    return normalizeActiveTimerInput({
      ...current,
      sessionLabel: mutation.sessionLabel,
      version: nextVersion,
      updatedAt: now,
    });
  }

  const mode = mutation.type === "reset" && mutation.mode ? mutation.mode : current.mode;
  const plannedDuration =
    mutation.type === "reset" ? normalizeDuration(mode, mutation.plannedDuration) : current.plannedDuration;

  return normalizeActiveTimerInput({
    mode,
    status: "idle",
    plannedDuration,
    secondsRemaining: plannedDuration,
    sessionLabel: mutation.type === "stop" ? current.sessionLabel : "",
    activeElapsedSeconds: 0,
    sessionStartedAt: null,
    runStartedAt: null,
    completedAt: null,
    version: nextVersion,
    updatedAt: now,
  });
}
