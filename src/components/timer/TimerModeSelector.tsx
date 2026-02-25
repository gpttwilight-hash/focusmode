"use client";

import { motion } from "framer-motion";
import { TimerMode, useTimerStore } from "@/lib/store/timer-store";
import { cn } from "@/lib/utils";

const MODES: { value: TimerMode; label: string; shortLabel: string }[] = [
  { value: "focus", label: "Focus", shortLabel: "Focus" },
  { value: "short_break", label: "Short Break", shortLabel: "Short" },
  { value: "long_break", label: "Long Break", shortLabel: "Long" },
];

export function TimerModeSelector() {
  const { mode, setMode, status } = useTimerStore();
  const isDisabled = status === "running" || status === "paused";

  return (
    <div className="flex items-center gap-1 p-1 glass-sm rounded-2xl">
      {MODES.map(({ value, label }) => {
        const isActive = mode === value;
        return (
          <button
            key={value}
            onClick={() => !isDisabled && setMode(value)}
            disabled={isDisabled}
            className={cn(
              "relative px-4 py-2 rounded-xl text-xs font-medium tracking-wide transition-colors duration-200",
              isDisabled && "cursor-not-allowed",
              isActive
                ? "text-[var(--ff-text-primary)]"
                : "text-[var(--ff-text-tertiary)] hover:text-[var(--ff-text-secondary)]"
            )}
          >
            {isActive && (
              <motion.div
                layoutId="mode-active"
                className="absolute inset-0 rounded-xl"
                style={{
                  background: "var(--ff-glass-03)",
                  border: "1px solid var(--ff-border-accent)",
                }}
                transition={{ type: "spring", stiffness: 400, damping: 35 }}
              />
            )}
            <span className="relative z-10">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
