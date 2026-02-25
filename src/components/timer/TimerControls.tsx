"use client";

import { motion } from "framer-motion";
import { Play, Pause, Square, RotateCcw } from "lucide-react";
import { TimerStatus } from "@/lib/store/timer-store";
import { cn } from "@/lib/utils";

interface Props {
  status: TimerStatus;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onReset: () => void;
}

export function TimerControls({ status, onStart, onPause, onResume, onStop, onReset }: Props) {
  const isIdle = status === "idle";
  const isRunning = status === "running";
  const isPaused = status === "paused";
  const isComplete = status === "complete";

  return (
    <div className="flex items-center gap-3 mt-8">
      {/* Reset / Stop */}
      {(isPaused || isRunning) && (
        <motion.button
          key="stop"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onStop}
          className={cn(
            "w-11 h-11 rounded-xl flex items-center justify-center transition-colors duration-200",
            "glass-sm border-[var(--ff-border)] text-[var(--ff-text-tertiary)]",
            "hover:text-[var(--ff-error)] hover:border-[rgba(248,113,113,0.3)]"
          )}
          aria-label="Stop session"
        >
          <Square className="w-4 h-4" />
        </motion.button>
      )}

      {/* Main button */}
      <motion.button
        key={status}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        onClick={
          isIdle || isComplete
            ? onStart
            : isRunning
            ? onPause
            : onResume
        }
        className={cn(
          "relative flex items-center gap-3 px-8 h-12 rounded-2xl font-medium text-sm tracking-wide",
          "transition-all duration-300 overflow-hidden",
          isComplete
            ? "bg-[var(--ff-emerald-dim)] border border-[var(--ff-border-accent)] text-[var(--ff-emerald)]"
            : "text-[#080f0e]"
        )}
        style={
          !isComplete
            ? {
                background: isRunning
                  ? "rgba(16,185,129,0.85)"
                  : "var(--ff-emerald)",
              }
            : undefined
        }
      >
        {/* Shimmer on idle */}
        {isIdle && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }}
          />
        )}

        <span className="relative z-10 flex items-center gap-2.5">
          {isIdle && <Play className="w-4 h-4 fill-current" />}
          {isRunning && <Pause className="w-4 h-4 fill-current" />}
          {isPaused && <Play className="w-4 h-4 fill-current" />}
          {isComplete && <RotateCcw className="w-4 h-4" />}

          <span>
            {isIdle && "Start Session"}
            {isRunning && "Pause"}
            {isPaused && "Resume"}
            {isComplete && "New Session"}
          </span>
        </span>
      </motion.button>

      {/* Reset on idle */}
      {(isIdle || isPaused) && (
        <motion.button
          key="reset"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onReset}
          className={cn(
            "w-11 h-11 rounded-xl flex items-center justify-center transition-colors duration-200",
            "glass-sm border-[var(--ff-border)] text-[var(--ff-text-tertiary)]",
            "hover:text-[var(--ff-text-secondary)] hover:border-[var(--ff-border-accent)]"
          )}
          aria-label="Reset timer"
        >
          <RotateCcw className="w-4 h-4" />
        </motion.button>
      )}
    </div>
  );
}
