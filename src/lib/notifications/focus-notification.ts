import type { TimerMode } from "@/lib/store/timer-store";

type NotificationPermissionState = "default" | "denied" | "granted";

type ShowTimerCompleteNotificationInput = {
  enabled: boolean;
  permission: NotificationPermissionState;
  mode: TimerMode;
  createNotification: (title: string, options: NotificationOptions) => void;
};

const COPY: Record<TimerMode, { title: string; body: string }> = {
  focus: {
    title: "Focus session complete",
    body: "Nice work. Time for a break.",
  },
  short_break: {
    title: "Short break complete",
    body: "Ready to focus again.",
  },
  long_break: {
    title: "Long break complete",
    body: "Your next focus session is ready.",
  },
};

export function showTimerCompleteNotification({
  enabled,
  permission,
  mode,
  createNotification,
}: ShowTimerCompleteNotificationInput) {
  if (!enabled || permission !== "granted") return;

  const copy = COPY[mode];
  createNotification(copy.title, {
    body: copy.body,
    tag: "focusflow-timer-complete",
  });
}
