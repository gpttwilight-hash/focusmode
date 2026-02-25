"use client";

import { useTimerStore } from "@/lib/store/timer-store";
import { Target } from "lucide-react";

export function SessionGoalInput() {
  const { sessionLabel, setLabel, status } = useTimerStore();
  const isDisabled = status === "running";

  return (
    <div className="flex items-center gap-2 mt-4">
      <Target className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--ff-text-tertiary)" }} />
      <input
        type="text"
        value={sessionLabel}
        onChange={(e) => setLabel(e.target.value)}
        disabled={isDisabled}
        placeholder="What are you working on? (optional)"
        maxLength={80}
        className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--ff-text-tertiary)] disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ color: "var(--ff-text-secondary)" }}
      />
    </div>
  );
}
