"use client";

import { useEffect, useRef, useCallback } from "react";
import { useTimerStore } from "@/lib/store/timer-store";
import { useSessionStore } from "@/lib/store/session-store";
import { useAudioStore } from "@/lib/store/audio-store";
import { showTimerCompleteNotification } from "@/lib/notifications/focus-notification";
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
  } = useTimerStore();

  const { addSession, setCurrentSession } = useSessionStore();
  const { isPlaying, setPlaying, trackId } = useAudioStore();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerAlertStateRef = useRef<TimerAlertState>(createInitialTimerAlertState());

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const resetTimerAlerts = useCallback(() => {
    timerAlertStateRef.current = createInitialTimerAlertState();
  }, []);

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

  // Handle page visibility — resume from wall-clock on visibility change
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && status === "running") {
        syncRunningTime();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [status, syncRunningTime]);

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
    if (!isPlaying) setPlaying(true);
  }, [resetTimerAlerts, start, isPlaying, setPlaying]);

  const handlePause = useCallback(() => {
    pause();
  }, [pause]);

  const handleResume = useCallback(() => {
    void primeTimerAlertAudio();
    resume();
  }, [resume]);

  const handleStop = useCallback(() => {
    if (sessionStartedAt) {
      saveSession(false);
    }
    resetTimerAlerts();
    stop();
    setPlaying(false);
  }, [sessionStartedAt, saveSession, resetTimerAlerts, stop, setPlaying]);

  const handleReset = useCallback(() => {
    resetTimerAlerts();
    reset();
  }, [resetTimerAlerts, reset]);

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
  }, [desktopNotificationsEnabled, mode, saveSession, clearSavedSession, setPlaying]);

  // When status becomes "complete", save session
  useEffect(() => {
    if (status === "complete") {
      handleComplete();
    }
  }, [status, handleComplete]);

  const progress = plannedDuration > 0 ? 1 - secondsRemaining / plannedDuration : 0;

  return {
    status,
    secondsRemaining,
    plannedDuration,
    progress,
    mode,
    sessionLabel,
    handleStart,
    handlePause,
    handleResume,
    handleStop,
    reset: handleReset,
  };
}
