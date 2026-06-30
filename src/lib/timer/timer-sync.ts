import {
  calculateActiveElapsedSeconds,
  normalizeActiveTimerInput,
  type ActiveTimerMutation,
  type ActiveTimerState,
} from "./active-timer";

export type TimerStorePatch = {
  mode: ActiveTimerState["mode"];
  status: ActiveTimerState["status"];
  secondsRemaining: number;
  plannedDuration: number;
  sessionLabel: string;
  sessionStartedAt: Date | null;
  activeElapsedSeconds: number;
  runStartedAt: Date | null;
  syncVersion: number;
  syncUpdatedAt: Date | null;
};

export function shouldApplyRemoteTimerState({
  local,
  remote,
}: {
  local: Pick<ActiveTimerState, "version" | "updatedAt">;
  remote: Pick<ActiveTimerState, "version" | "updatedAt">;
}) {
  if (remote.version > local.version) return true;
  if (remote.version < local.version) return false;

  const remoteTime = remote.updatedAt?.getTime() ?? 0;
  const localTime = local.updatedAt?.getTime() ?? 0;
  return remoteTime > localTime;
}

export function toTimerStorePatch(remoteState: ActiveTimerState, now = new Date()): TimerStorePatch {
  const remote = normalizeActiveTimerInput(remoteState);
  const currentElapsedSeconds = Math.min(
    remote.plannedDuration,
    calculateActiveElapsedSeconds(remote, now)
  );

  return {
    mode: remote.mode,
    status: remote.status,
    secondsRemaining:
      remote.status === "idle"
        ? remote.plannedDuration
        : Math.max(0, remote.plannedDuration - currentElapsedSeconds),
    plannedDuration: remote.plannedDuration,
    sessionLabel: remote.sessionLabel,
    sessionStartedAt: remote.sessionStartedAt,
    activeElapsedSeconds: remote.activeElapsedSeconds,
    runStartedAt: remote.runStartedAt,
    syncVersion: remote.version,
    syncUpdatedAt: remote.updatedAt,
  };
}

export async function fetchActiveTimerState(): Promise<ActiveTimerState | null> {
  const response = await fetch("/api/timer/active", { cache: "no-store" });

  if (response.status === 401) return null;
  if (!response.ok) throw new Error("Unable to fetch active timer");

  return normalizeActiveTimerInput(await response.json());
}

export async function sendActiveTimerMutation(
  mutation: ActiveTimerMutation
): Promise<ActiveTimerState | null> {
  const response = await fetch("/api/timer/active", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(mutation),
  });

  if (response.status === 401) return null;
  if (!response.ok) throw new Error("Unable to sync active timer");

  return normalizeActiveTimerInput(await response.json());
}
