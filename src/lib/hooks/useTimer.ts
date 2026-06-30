"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTimerStore } from "@/lib/store/timer-store";
import { useSessionStore } from "@/lib/store/session-store";
import { useAudioStore } from "@/lib/store/audio-store";
import { showTimerCompleteNotification } from "@/lib/notifications/focus-notification";
import {
  fetchActiveTimerState,
  sendActiveTimerMutation,
} from "@/lib/timer/timer-sync";
import type { ActiveTimerMutation } from "@/lib/timer/active-timer";
import {
  createInitialTimerAlertState,
  getTimerAlertCue,
  playTimerAlertCue,
  primeTimerAlertAudio,
  type TimerAlertState,
} from "@/lib/audio/timer-alerts";

export function useTimer() {
  const {
    status,
    secondsRemaining,
    plannedDuration,
    sessionLabel,
    sessionStartedAt,
    desktopNotificationsEnabled,
    mode,
    getActiveElapsedSeconds,
    syncRunningTime,
    start,
    pause,
    resume,
    stop,
    reset,
    clearSavedSession,
    customDurations,
    applyRemoteTimerState,
  } = useTimerStore();

  const { addSession, setCurrentSession } = useSessionStore();
  const { isPlaying, setPlaying, trackId } = useAudioStore();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerAlertStateRef = useRef<TimerAlertState>(createInitialTimerAlertState());
  const completionHandledRef = useRef(false);
  const [syncStatus, setSyncStatus] = useState<
    "idle" | "syncing" | "synced" | "offline" | "signed-out"
  >("idle");

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const resetTimerAlerts = useCallback(() => {
    timerAlertStateRef.current = createInitialTimerAlertState();
  }, []);

  const syncFromRemote = useCallback(
    async (quiet = false) => {
      if (!quiet) setSyncStatus("syncing");

      try {
        const remoteState = await fetchActiveTimerState();
        if (!remoteState) {
          setSyncStatus("signed-out");
          return;
        }

        applyRemoteTimerState(remoteState);
        setSyncStatus("synced");
      } catch {
        setSyncStatus("offline");
      }
    },
    [applyRemoteTimerState]
  );

  const syncMutation = useCallback(
    (mutation: ActiveTimerMutation) => {
      setSyncStatus("syncing");

      void sendActiveTimerMutation(mutation)
        .then((remoteState) => {
          if (!remoteState) {
            setSyncStatus("signed-out");
            return;
          }

          applyRemoteTimerState(remoteState);
          setSyncStatus("synced");
        })
        .catch(() => {
          setSyncStatus("offline");
        });
    },
    [applyRemoteTimerState]
  );

  const saveSession = useCallback(
    (completed: boolean) => {
      if (!sessionStartedAt) return;
      const now = new Date();
      const actualDuration = Math.min(plannedDuration, getActiveElapsedSeconds(now.getTime()));
      addSession({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        label: sessionLabel,
        mode,
        plannedDuration,
        actualDuration,
        startedAt: sessionStartedAt,
        endedAt: now,
        completed,
        interrupted: !completed,
        audioTrackId: trackId || undefined,
        synced: false,
      });
      setCurrentSession(null);
    },
    [
      sessionStartedAt,
      sessionLabel,
      mode,
      plannedDuration,
      trackId,
      getActiveElapsedSeconds,
      addSession,
      setCurrentSession,
    ]
  );

  useEffect(() => {
    if (status === "running") {
      syncRunningTime();
      intervalRef.current = setInterval(() => syncRunningTime(), 250);
    } else {
      clearTimer();
    }

    return clearTimer;
  }, [status, clearTimer, syncRunningTime]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void syncFromRemote(true);
    }, 0);

    return () => clearTimeout(timeout);
  }, [syncFromRemote]);

  useEffect(() => {
    if (syncStatus === "signed-out") return;

    const interval = setInterval(() => {
      void syncFromRemote(true);
    }, status === "running" || status === "paused" ? 1000 : 6000);

    return () => clearInterval(interval);
  }, [status, syncFromRemote, syncStatus]);

  // Handle page visibility — resume from wall-clock on visibility change
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && status === "running") {
        syncRunningTime();
      }
      if (document.visibilityState === "visible") {
        void syncFromRemote(true);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [status, syncRunningTime, syncFromRemote]);

  useEffect(() => {
    const handleFocus = () => {
      void syncFromRemote(true);
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [syncFromRemote]);

  // Update browser tab title
  useEffect(() => {
    if (status === "running" || status === "paused") {
      const mins = Math.floor(secondsRemaining / 60).toString().padStart(2, "0");
      const secs = (secondsRemaining % 60).toString().padStart(2, "0");
      const modeLabel = mode === "focus" ? "Focus" : mode === "short_break" ? "Short Break" : "Long Break";
      document.title = `${mins}:${secs} — ${modeLabel} · FocusFlow`;
    } else {
      document.title = "FocusFlow — Deep Work Sessions";
    }
  }, [status, secondsRemaining, mode]);

  // Play soft timer alert sounds near the end and at completion.
  useEffect(() => {
    const cue = getTimerAlertCue({
      status,
      secondsRemaining,
      state: timerAlertStateRef.current,
    });

    if (!cue) {
      if (status === "idle") resetTimerAlerts();
      return;
    }

    if (cue === "countdown") {
      timerAlertStateRef.current.lastCountdownSecond = secondsRemaining;
    } else {
      timerAlertStateRef.current.completionPlayed = true;
    }

    void playTimerAlertCue(cue);
  }, [status, secondsRemaining, resetTimerAlerts]);

  const handleStart = useCallback(() => {
    resetTimerAlerts();
    void primeTimerAlertAudio();
    start();
    syncMutation({
      type: "start",
      mode,
      plannedDuration: customDurations[mode],
      sessionLabel,
    });
    if (!isPlaying) setPlaying(true);
  }, [
    resetTimerAlerts,
    start,
    syncMutation,
    mode,
    customDurations,
    sessionLabel,
    isPlaying,
    setPlaying,
  ]);

  const handlePause = useCallback(() => {
    pause();
    syncMutation({ type: "pause" });
  }, [pause, syncMutation]);

  const handleResume = useCallback(() => {
    void primeTimerAlertAudio();
    resume();
    syncMutation({ type: "resume" });
  }, [resume, syncMutation]);

  const handleStop = useCallback(() => {
    if (sessionStartedAt) {
      saveSession(false);
    }
    resetTimerAlerts();
    stop();
    syncMutation({ type: "stop" });
    setPlaying(false);
  }, [sessionStartedAt, saveSession, resetTimerAlerts, stop, syncMutation, setPlaying]);

  const handleReset = useCallback(() => {
    resetTimerAlerts();
    reset();
    syncMutation({
      type: "reset",
      mode,
      plannedDuration: customDurations[mode],
    });
  }, [resetTimerAlerts, reset, syncMutation, mode, customDurations]);

  const handleComplete = useCallback(() => {
    saveSession(true);
    clearSavedSession();
    if (typeof window !== "undefined" && "Notification" in window) {
      showTimerCompleteNotification({
        enabled: desktopNotificationsEnabled,
        permission: Notification.permission,
        mode,
        createNotification: (title, options) => {
          new Notification(title, options);
        },
      });
    }
    setPlaying(false);
    syncMutation({ type: "complete" });
  }, [
    desktopNotificationsEnabled,
    mode,
    saveSession,
    clearSavedSession,
    setPlaying,
    syncMutation,
  ]);

  // When status becomes "complete", save session
  useEffect(() => {
    if (status !== "complete") {
      completionHandledRef.current = false;
      return;
    }

    if (completionHandledRef.current) return;
    completionHandledRef.current = true;

    const timeout = setTimeout(() => {
      handleComplete();
    }, 0);

    return () => clearTimeout(timeout);
  }, [status, handleComplete]);

  const progress = plannedDuration > 0 ? 1 - secondsRemaining / plannedDuration : 0;

  return {
    status,
    secondsRemaining,
    plannedDuration,
    progress,
    mode,
    sessionLabel,
    syncStatus,
    handleStart,
    handlePause,
    handleResume,
    handleStop,
    reset: handleReset,
  };
}
