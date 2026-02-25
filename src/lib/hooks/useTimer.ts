"use client";

import { useEffect, useRef, useCallback } from "react";
import { useTimerStore } from "@/lib/store/timer-store";
import { useSessionStore } from "@/lib/store/session-store";
import { useAudioStore } from "@/lib/store/audio-store";

export function useTimer() {
  const {
    status,
    secondsRemaining,
    plannedDuration,
    sessionLabel,
    sessionStartedAt,
    mode,
    setSecondsRemaining,
    markComplete,
    start,
    pause,
    resume,
    stop,
    reset,
  } = useTimerStore();

  const { addSession, setCurrentSession } = useSessionStore();
  const { isPlaying, setPlaying, trackId } = useAudioStore();

  // Wall-clock approach: store start time and remaining seconds
  const startWallRef = useRef<number | null>(null);
  const startRemainingRef = useRef<number>(secondsRemaining);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const saveSession = useCallback(
    (completed: boolean) => {
      if (!sessionStartedAt) return;
      const now = new Date();
      const actualDuration = Math.round(
        (now.getTime() - sessionStartedAt.getTime()) / 1000
      );
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
    [sessionStartedAt, sessionLabel, mode, plannedDuration, trackId, addSession, setCurrentSession]
  );

  useEffect(() => {
    if (status === "running") {
      startWallRef.current = Date.now();
      startRemainingRef.current = secondsRemaining;

      intervalRef.current = setInterval(() => {
        if (!startWallRef.current) return;
        const elapsed = Math.floor((Date.now() - startWallRef.current) / 1000);
        const remaining = startRemainingRef.current - elapsed;

        if (remaining <= 0) {
          clearTimer();
          markComplete();
        } else {
          setSecondsRemaining(remaining);
        }
      }, 250);
    } else {
      clearTimer();
      startWallRef.current = null;
    }

    return clearTimer;
  }, [status, clearTimer, markComplete, setSecondsRemaining]);

  // Handle page visibility — resume from wall-clock on visibility change
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && status === "running") {
        if (startWallRef.current) {
          const elapsed = Math.floor((Date.now() - startWallRef.current) / 1000);
          const remaining = startRemainingRef.current - elapsed;
          if (remaining <= 0) {
            clearTimer();
            markComplete();
          } else {
            setSecondsRemaining(remaining);
          }
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [status, clearTimer, markComplete, setSecondsRemaining]);

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

  const handleStart = useCallback(() => {
    start();
    if (!isPlaying) setPlaying(true);
  }, [start, isPlaying, setPlaying]);

  const handlePause = useCallback(() => {
    pause();
  }, [pause]);

  const handleResume = useCallback(() => {
    // Restart wall-clock from current remaining
    startWallRef.current = Date.now();
    startRemainingRef.current = secondsRemaining;
    resume();
  }, [resume, secondsRemaining]);

  const handleStop = useCallback(() => {
    if (sessionStartedAt) {
      saveSession(false);
    }
    stop();
    setPlaying(false);
  }, [sessionStartedAt, saveSession, stop, setPlaying]);

  const handleComplete = useCallback(() => {
    saveSession(true);
    setPlaying(false);
  }, [saveSession, setPlaying]);

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
    reset,
  };
}
