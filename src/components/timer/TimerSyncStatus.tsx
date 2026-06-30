"use client";

import { Cloud, CloudOff, RefreshCw, UserRoundX } from "lucide-react";

type TimerSyncStatusValue = "idle" | "syncing" | "synced" | "offline" | "signed-out";

const LABELS: Record<TimerSyncStatusValue, string> = {
  idle: "Local timer",
  syncing: "Syncing...",
  synced: "Synced",
  offline: "Offline",
  "signed-out": "Sign in to sync",
};

export function TimerSyncStatus({ status }: { status: TimerSyncStatusValue }) {
  const Icon =
    status === "offline" ? CloudOff : status === "signed-out" ? UserRoundX : status === "syncing" ? RefreshCw : Cloud;

  return (
    <div
      className="mt-3 flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px]"
      style={{
        color: status === "offline" ? "var(--ff-error)" : "var(--ff-text-tertiary)",
        background: "var(--ff-glass-02)",
        border: "1px solid var(--ff-border)",
      }}
    >
      <Icon className={`h-3 w-3 ${status === "syncing" ? "animate-spin" : ""}`} />
      <span>{LABELS[status]}</span>
    </div>
  );
}
