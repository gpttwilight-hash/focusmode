"use client";

import { motion } from "framer-motion";
import { CheckCircle, Coffee, Zap } from "lucide-react";
import { TimerMode, useTimerStore } from "@/lib/store/timer-store";
import { useSessionStore } from "@/lib/store/session-store";
import { formatMinutes } from "@/lib/utils/format";

interface Props {
  mode: TimerMode;
  plannedDuration: number;
  onClose: () => void;
}

export function SessionCompleteModal({ mode, plannedDuration, onClose }: Props) {
  const { setMode, completedPomodoros } = useTimerStore();
  const sessions = useSessionStore((s) => s.sessions);
  const todaySessions = sessions.filter(
    (s) =>
      s.mode === "focus" &&
      s.completed &&
      s.startedAt.toDateString() === new Date().toDateString()
  );
  const todayMinutes = todaySessions.reduce(
    (acc, s) => acc + Math.round(s.actualDuration / 60),
    0
  );

  const isFocus = mode === "focus";

  const handleStartBreak = (breakMode: "short_break" | "long_break") => {
    setMode(breakMode);
    onClose();
    setTimeout(() => useTimerStore.getState().start(), 100);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center pb-20 px-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 30 }}
        className="glass-heavy rounded-3xl p-8 w-full max-w-sm"
      >
        {/* Icon */}
        <div className="flex justify-center mb-5">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.1 }}
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: "var(--ff-emerald-dim)" }}
          >
            <CheckCircle className="w-8 h-8" style={{ color: "var(--ff-emerald)" }} />
          </motion.div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-semibold text-center mb-1" style={{ color: "var(--ff-text-primary)" }}>
          {isFocus ? "Session complete!" : "Break's over!"}
        </h2>
        <p className="text-sm text-center mb-6" style={{ color: "var(--ff-text-secondary)" }}>
          {isFocus
            ? `${formatMinutes(Math.round(plannedDuration / 60))} of focused work`
            : "Time to get back to work"}
        </p>

        {/* Today stats */}
        {isFocus && (
          <div className="flex gap-3 mb-6">
            <div className="flex-1 p-3 glass-sm rounded-xl text-center">
              <div className="text-lg font-semibold font-timer" style={{ color: "var(--ff-emerald)" }}>
                {todaySessions.length}
              </div>
              <div className="text-[10px]" style={{ color: "var(--ff-text-tertiary)" }}>
                sessions today
              </div>
            </div>
            <div className="flex-1 p-3 glass-sm rounded-xl text-center">
              <div className="text-lg font-semibold font-timer" style={{ color: "var(--ff-emerald)" }}>
                {formatMinutes(todayMinutes)}
              </div>
              <div className="text-[10px]" style={{ color: "var(--ff-text-tertiary)" }}>
                total focus
              </div>
            </div>
            <div className="flex-1 p-3 glass-sm rounded-xl text-center">
              <div className="text-lg font-semibold font-timer" style={{ color: "var(--ff-emerald)" }}>
                {completedPomodoros}
              </div>
              <div className="text-[10px]" style={{ color: "var(--ff-text-tertiary)" }}>
                pomodoros
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2">
          {isFocus && (
            <>
              <button
                onClick={() => handleStartBreak("short_break")}
                className="flex items-center justify-center gap-2 h-11 rounded-xl font-medium text-sm transition-all"
                style={{
                  background: "var(--ff-emerald)",
                  color: "#080f0e",
                }}
              >
                <Coffee className="w-4 h-4" />
                Short Break (5 min)
              </button>
              <button
                onClick={() => handleStartBreak("long_break")}
                className="flex items-center justify-center gap-2 h-11 rounded-xl font-medium text-sm glass-sm transition-all hover:border-[var(--ff-border-accent)]"
                style={{ color: "var(--ff-text-secondary)" }}
              >
                Long Break (15 min)
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className="flex items-center justify-center gap-2 h-11 rounded-xl font-medium text-sm transition-all"
            style={{
              background: isFocus ? "transparent" : "var(--ff-emerald)",
              color: isFocus ? "var(--ff-text-tertiary)" : "#080f0e",
            }}
          >
            {!isFocus && <Zap className="w-4 h-4" />}
            {isFocus ? "Skip break" : "Start focusing"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
