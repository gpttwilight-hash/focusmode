import { BarChart3, History, Settings, Timer, UserRound } from "lucide-react";

export const APP_NAV_ITEM = {
  href: "/",
  label: "FocusFlow",
};

export const SIDEBAR_NAV_ITEMS = [
  { href: "/", icon: Timer, label: "Focus Timer" },
  { href: "/history", icon: History, label: "Session History" },
  { href: "/dashboard", icon: BarChart3, label: "Dashboard" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export const ACCOUNT_NAV_ITEM = {
  href: "/settings",
  icon: UserRound,
  label: "Account",
};

export const STATUS_NAV_ITEM = {
  icon: "0",
  label: "Focus streak",
};

export function getFocusStreakLabel(streak: number) {
  return `${STATUS_NAV_ITEM.label}: ${Math.max(0, Math.round(streak))} days`;
}
