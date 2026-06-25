"use client";

import { useEffect } from "react";
import { useTimerStore } from "@/lib/store/timer-store";
import { toTimerDurations, type ProfileTimerSettings } from "@/lib/settings/timer-settings";

export function ProfileSettingsLoader() {
  const setCustomDurations = useTimerStore((state) => state.setCustomDurations);

  useEffect(() => {
    let cancelled = false;

    async function loadProfileSettings() {
      try {
        const response = await fetch("/api/settings", { cache: "no-store" });
        if (!response.ok) return;

        const settings = (await response.json()) as ProfileTimerSettings;
        if (!cancelled) {
          setCustomDurations(toTimerDurations(settings));
        }
      } catch {
        // Local persisted settings stay in place if profile settings cannot be loaded.
      }
    }

    void loadProfileSettings();

    return () => {
      cancelled = true;
    };
  }, [setCustomDurations]);

  return null;
}
