"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Timer, BarChart3, History, Settings, Zap } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", icon: Timer, label: "Focus Timer" },
  { href: "/history", icon: History, label: "Session History" },
  { href: "/dashboard", icon: BarChart3, label: "Dashboard" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <motion.aside
      initial={{ x: -80, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 35, delay: 0.1 }}
      className="fixed left-0 top-0 h-full w-16 z-40 flex flex-col items-center py-6 gap-2"
    >
      {/* Glass background */}
      <div
        className="absolute inset-0 glass border-r"
        style={{ borderRadius: 0 }}
      />

      {/* Logo */}
      <div className="relative z-10 mb-6">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--ff-emerald-dim)] border border-[var(--ff-border-accent)]">
          <Zap className="w-4 h-4 text-[var(--ff-emerald)]" />
        </div>
      </div>

      {/* Nav items */}
      <nav className="relative z-10 flex flex-col gap-1 flex-1">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href;
          return (
            <Tooltip key={href}>
              <TooltipTrigger asChild>
                <Link
                  href={href}
                  className={cn(
                    "relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200",
                    isActive
                      ? "bg-[var(--ff-emerald-dim)] text-[var(--ff-emerald)]"
                      : "text-[var(--ff-text-tertiary)] hover:text-[var(--ff-text-secondary)] hover:bg-[var(--ff-glass-03)]"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 rounded-xl bg-[var(--ff-emerald-dim)] border border-[var(--ff-border-accent)]"
                      transition={{ type: "spring", stiffness: 400, damping: 35 }}
                    />
                  )}
                  <Icon className="relative z-10 w-4 h-4" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="glass border-[var(--ff-border)]">
                <p className="text-[var(--ff-text-primary)] text-xs">{label}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      {/* Streak indicator */}
      <div className="relative z-10 mt-auto">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="w-10 h-10 rounded-xl flex flex-col items-center justify-center bg-[var(--ff-glass-03)] cursor-default">
              <span className="text-[10px] leading-none">🔥</span>
              <span className="text-[10px] text-[var(--ff-emerald)] font-mono font-medium mt-0.5">0</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="glass border-[var(--ff-border)]">
            <p className="text-[var(--ff-text-primary)] text-xs">0-day streak</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </motion.aside>
  );
}
