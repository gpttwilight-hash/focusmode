"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Music2, ChevronUp } from "lucide-react";
import { CircularTimer } from "./CircularTimer";
import { TimerControls } from "./TimerControls";
import { TimerModeSelector } from "./TimerModeSelector";
import { SessionGoalInput } from "./SessionGoalInput";
import { SessionCompleteModal } from "./SessionCompleteModal";
import { useTimer } from "@/lib/hooks/useTimer";
import { useAudioStore } from "@/lib/store/audio-store";

export function TimerScreen() {
  const {
    status,
    secondsRemaining,
    plannedDuration,
    progress,
    mode,
    handleStart,
    handlePause,
    handleResume,
    handleStop,
    reset,
  } = useTimer();

  const { isPanelOpen, togglePanel } = useAudioStore();
  const [isZen, setIsZen] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const zenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Zen mode: fade UI after 4s of running, restore on mouse move
  useEffect(() => {
    if (status === "running") {
      zenTimerRef.current = setTimeout(() => setIsZen(true), 4000);
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsZen(false);
      if (zenTimerRef.current) clearTimeout(zenTimerRef.current);
    }
    return () => {
      if (zenTimerRef.current) clearTimeout(zenTimerRef.current);
    };
  }, [status]);

  useEffect(() => {
    if (status === "running") {
      const handleMove = () => {
        setIsZen(false);
        if (zenTimerRef.current) clearTimeout(zenTimerRef.current);
        zenTimerRef.current = setTimeout(() => setIsZen(true), 4000);
      };
      window.addEventListener("mousemove", handleMove);
      return () => window.removeEventListener("mousemove", handleMove);
    }
  }, [status]);

  // Show complete modal
  useEffect(() => {
    if (status === "complete") {
      // eslint-disable-next-line
      setShowCompleteModal(true);
    }
  }, [status, reset, mode, plannedDuration]);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen px-4">
      {/* Top bar with mode selector */}
      <motion.div
        animate={{ opacity: isZen ? 0.04 : 1 }}
        transition={{ duration: isZen ? 1.5 : 0.3 }}
        className="absolute top-8 left-0 right-0 flex justify-center pointer-events-none"
        style={{ pointerEvents: isZen ? "none" : "auto" }}
      >
        <TimerModeSelector />
      </motion.div>

      {/* Main timer area */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 28, delay: 0.1 }}
        className="flex flex-col items-center gap-0"
      >
        <CircularTimer
          secondsRemaining={secondsRemaining}
          progress={progress}
          status={status}
          mode={mode}
        />

        {/* Session goal input */}
        <motion.div
          animate={{ opacity: isZen ? 0.08 : 1 }}
          transition={{ duration: isZen ? 1.5 : 0.3 }}
          className="w-72 mt-2 px-4 py-2 glass-sm rounded-xl"
          style={{ pointerEvents: isZen ? "none" : "auto" }}
        >
          <SessionGoalInput />
        </motion.div>

        {/* Controls */}
        <TimerControls
          status={status}
          onStart={handleStart}
          onPause={handlePause}
          onResume={handleResume}
          onStop={handleStop}
          onReset={reset}
        />
      </motion.div>

      {/* Music toggle button */}
      <motion.div
        animate={{ opacity: isZen ? 0.06 : 1 }}
        transition={{ duration: isZen ? 1.5 : 0.3 }}
        className="absolute bottom-8 right-8"
        style={{ pointerEvents: isZen ? "none" : "auto" }}
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={togglePanel}
          className="flex items-center gap-2 px-4 h-10 rounded-2xl glass-sm text-sm transition-all duration-200"
          style={{
            color: isPanelOpen ? "var(--ff-emerald)" : "var(--ff-text-secondary)",
            borderColor: isPanelOpen ? "var(--ff-border-accent)" : undefined,
          }}
        >
          <Music2 className="w-4 h-4" />
          <span className="text-xs">
            {isPanelOpen ? "Hide music" : "Music"}
          </span>
          <ChevronUp
            className="w-3 h-3 transition-transform duration-200"
            style={{ transform: isPanelOpen ? "rotate(180deg)" : undefined }}
          />
        </motion.button>
      </motion.div>

      {/* Session Complete Modal */}
      <AnimatePresence>
        {showCompleteModal && (
          <SessionCompleteModal
            mode={mode}
            plannedDuration={plannedDuration}
            onClose={() => {
              setShowCompleteModal(false);
              reset();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
