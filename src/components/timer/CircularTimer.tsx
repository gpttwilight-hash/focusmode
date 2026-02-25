"use client";

import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";
import { formatTime } from "@/lib/utils/format";
import { TimerMode, TimerStatus } from "@/lib/store/timer-store";

interface Props {
  secondsRemaining: number;
  plannedDuration: number;
  progress: number;
  status: TimerStatus;
  mode: TimerMode;
}

const RADIUS = 130;
const STROKE_WIDTH = 5;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const SVG_SIZE = (RADIUS + 20) * 2;

const MODE_LABELS: Record<TimerMode, string> = {
  focus: "FOCUS",
  short_break: "SHORT BREAK",
  long_break: "LONG BREAK",
};

const TICK_COUNT = 60;

export function CircularTimer({ secondsRemaining, plannedDuration, progress, status, mode }: Props) {
  const springProgress = useSpring(progress, {
    stiffness: 80,
    damping: 25,
    restDelta: 0.001,
  });

  useEffect(() => {
    springProgress.set(progress);
  }, [progress, springProgress]);

  const strokeDashoffset = useTransform(
    springProgress,
    (v) => CIRCUMFERENCE - v * CIRCUMFERENCE
  );

  const isRunning = status === "running";
  const isComplete = status === "complete";

  // Tick marks around the ring
  const ticks = Array.from({ length: TICK_COUNT }, (_, i) => {
    const angle = (i / TICK_COUNT) * 360 - 90;
    const isMajor = i % 5 === 0;
    const innerRadius = RADIUS - (isMajor ? 12 : 7);
    const outerRadius = RADIUS - 1;
    const rad = (angle * Math.PI) / 180;
    const center = RADIUS + 20;
    return {
      x1: center + innerRadius * Math.cos(rad),
      y1: center + innerRadius * Math.sin(rad),
      x2: center + outerRadius * Math.cos(rad),
      y2: center + outerRadius * Math.sin(rad),
      isMajor,
      passed: i / TICK_COUNT <= progress,
    };
  });

  return (
    <div className="relative flex items-center justify-center select-none">
      {/* Outer glow when running */}
      {isRunning && (
        <motion.div
          className="absolute rounded-full"
          style={{
            width: SVG_SIZE + 20,
            height: SVG_SIZE + 20,
            background: "radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)",
          }}
          animate={{ scale: [1, 1.04, 1], opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      <svg
        width={SVG_SIZE}
        height={SVG_SIZE}
        viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
        className="overflow-visible"
      >
        <defs>
          <filter id="emerald-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Tick marks */}
        {ticks.map((tick, i) => (
          <line
            key={i}
            x1={tick.x1}
            y1={tick.y1}
            x2={tick.x2}
            y2={tick.y2}
            stroke={
              tick.passed
                ? tick.isMajor
                  ? "rgba(16,185,129,0.6)"
                  : "rgba(16,185,129,0.3)"
                : tick.isMajor
                ? "rgba(255,255,255,0.12)"
                : "rgba(255,255,255,0.05)"
            }
            strokeWidth={tick.isMajor ? 1.5 : 1}
            strokeLinecap="round"
          />
        ))}

        {/* Background ring */}
        <circle
          cx={RADIUS + 20}
          cy={RADIUS + 20}
          r={RADIUS}
          fill="none"
          stroke="rgba(255,255,255,0.04)"
          strokeWidth={STROKE_WIDTH}
        />

        {/* Progress ring */}
        <motion.circle
          cx={RADIUS + 20}
          cy={RADIUS + 20}
          r={RADIUS}
          fill="none"
          stroke={isComplete ? "#34d399" : "#10b981"}
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          style={{ strokeDashoffset }}
          transform={`rotate(-90 ${RADIUS + 20} ${RADIUS + 20})`}
          filter="url(#emerald-glow)"
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
        {/* Mode label */}
        <motion.span
          key={mode}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[10px] tracking-[0.18em] uppercase font-medium"
          style={{ color: "var(--ff-text-tertiary)" }}
        >
          {MODE_LABELS[mode]}
        </motion.span>

        {/* Time display */}
        <motion.span
          key={`${status}-time`}
          className="font-timer text-[4.5rem] leading-none"
          style={{
            color: isComplete ? "var(--ff-emerald-soft)" : "var(--ff-text-primary)",
            filter: isRunning ? "drop-shadow(0 0 20px rgba(16,185,129,0.3))" : "none",
          }}
        >
          {isComplete ? "Done!" : formatTime(secondsRemaining)}
        </motion.span>

        {/* Status dot */}
        <div className="flex items-center gap-1.5 mt-1">
          <motion.div
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: "var(--ff-emerald)" }}
            animate={
              isRunning
                ? { scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }
                : { scale: 1, opacity: isComplete ? 1 : 0.3 }
            }
            transition={isRunning ? { duration: 2, repeat: Infinity } : undefined}
          />
          <span
            className="text-[10px] tracking-wider"
            style={{ color: "var(--ff-text-tertiary)" }}
          >
            {status === "idle" && "READY"}
            {status === "running" && "ACTIVE"}
            {status === "paused" && "PAUSED"}
            {status === "complete" && "COMPLETE"}
          </span>
        </div>
      </div>
    </div>
  );
}
