import type { TimerStatus } from "@/lib/store/timer-store";

export const DOT_FIELD_BACKGROUND_PROPS = {
  dotRadius: 1.6,
  dotSpacing: 15,
  cursorRadius: 460,
  cursorForce: 0.08,
  bulgeOnly: true,
  bulgeStrength: 54,
  glowRadius: 180,
  sparkle: false,
  waveAmplitude: 0,
  gradientFrom: "rgba(16, 185, 129, 0.34)",
  gradientTo: "rgba(20, 184, 166, 0.18)",
  glowColor: "rgba(16, 185, 129, 0.22)",
} as const;

export function getDotFieldLayerClassName(status: TimerStatus) {
  const opacity = status === "running" ? "opacity-35" : "opacity-75";

  return [
    "fixed",
    "inset-0",
    "pointer-events-none",
    "z-0",
    "transition-opacity",
    "duration-700",
    "ease-out",
    opacity,
  ].join(" ");
}
