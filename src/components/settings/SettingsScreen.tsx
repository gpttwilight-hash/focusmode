"use client";

import { motion } from "framer-motion";
import { Timer, Shield, Zap, Volume2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { useTimerStore, TimerMode } from "@/lib/store/timer-store";
import { useAudioStore } from "@/lib/store/audio-store";
import {
    toProfileTimerSettings,
    toTimerDurations,
    type ProfileTimerSettings,
} from "@/lib/settings/timer-settings";
import { useRef, useState } from "react";

type SettingItem = {
    label: string;
    value: string;
    type: "slider" | "toggle" | "button";
    min?: number;
    max?: number;
    currentValue?: number[];
    onChange?: (v: number[]) => void;
    active?: boolean;
    onToggle?: () => void;
    action?: string;
    onClick?: () => void;
};

type SettingsGroup = {
    title: string;
    icon: React.ElementType;
    items: SettingItem[];
};

export function SettingsScreen() {
    const {
        customDurations,
        desktopNotificationsEnabled,
        setCustomDuration,
        setCustomDurations,
        setDesktopNotificationsEnabled,
    } = useTimerStore();
    const { isPlaying, setPlaying, isMuted, toggleMute } = useAudioStore();

    // For unimplemented features, use local state so toggles feel responsive
    const [calendarSync, setCalendarSync] = useState(false);
    const [cloudSync, setCloudSync] = useState(true);
    const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
    const saveRequestId = useRef(0);

    const saveProfileSettings = async (
        nextDurations: typeof customDurations,
        notificationsEnabled: boolean
    ) => {
        const requestId = saveRequestId.current + 1;
        saveRequestId.current = requestId;
        setSaveStatus("saving");

        try {
            const profileSettings = {
                ...toProfileTimerSettings(nextDurations),
                desktopNotificationsEnabled: notificationsEnabled,
            };
            const response = await fetch("/api/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(profileSettings),
            });

            if (!response.ok) throw new Error("Unable to save settings");

            const settings = (await response.json()) as ProfileTimerSettings;
            if (saveRequestId.current === requestId) {
                setCustomDurations(toTimerDurations(settings));
                setDesktopNotificationsEnabled(settings.desktopNotificationsEnabled);
                setSaveStatus("saved");
            }
        } catch {
            if (saveRequestId.current === requestId) {
                setSaveStatus("error");
            }
        }
    };

    const handleDurationChange = (mode: TimerMode, value: number[]) => {
        const seconds = value[0] * 60;
        const nextDurations = { ...customDurations, [mode]: seconds };

        setCustomDuration(mode, seconds);
        void saveProfileSettings(nextDurations, desktopNotificationsEnabled);
    };

    const handleNotificationsToggle = async () => {
        if (desktopNotificationsEnabled) {
            setDesktopNotificationsEnabled(false);
            await saveProfileSettings(customDurations, false);
            return;
        }

        if (typeof window === "undefined" || !("Notification" in window)) {
            setSaveStatus("error");
            return;
        }

        const permission =
            Notification.permission === "granted"
                ? "granted"
                : await Notification.requestPermission();

        if (permission !== "granted") {
            setDesktopNotificationsEnabled(false);
            setSaveStatus("error");
            return;
        }

        setDesktopNotificationsEnabled(true);
        await saveProfileSettings(customDurations, true);
    };

    const settingsGroups: SettingsGroup[] = [
        {
            title: "Focus & Break Lengths",
            icon: Timer,
            items: [
                {
                    label: "Focus Duration",
                    value: `${Math.round(customDurations.focus / 60)} min`,
                    type: "slider",
                    min: 10, max: 90,
                    currentValue: [Math.round(customDurations.focus / 60)],
                    onChange: (v: number[]) => handleDurationChange("focus", v)
                },
                {
                    label: "Short Break",
                    value: `${Math.round(customDurations.short_break / 60)} min`,
                    type: "slider",
                    min: 1, max: 15,
                    currentValue: [Math.round(customDurations.short_break / 60)],
                    onChange: (v: number[]) => handleDurationChange("short_break", v)
                },
                {
                    label: "Long Break",
                    value: `${Math.round(customDurations.long_break / 60)} min`,
                    type: "slider",
                    min: 5, max: 30,
                    currentValue: [Math.round(customDurations.long_break / 60)],
                    onChange: (v: number[]) => handleDurationChange("long_break", v)
                },
            ]
        },
        {
            title: "Audio & Notifications",
            icon: Volume2,
            items: [
                {
                    label: "Ambient Music",
                    value: isPlaying ? "Playing" : "Paused",
                    type: "toggle",
                    active: isPlaying,
                    onToggle: () => setPlaying(!isPlaying)
                },
                {
                    label: "Mute All Sounds",
                    value: isMuted ? "Muted" : "Unmuted",
                    type: "toggle",
                    active: isMuted,
                    onToggle: toggleMute
                },
                {
                    label: "Desktop Notifications",
                    value: desktopNotificationsEnabled ? "Enabled" : "Disabled",
                    type: "toggle",
                    active: desktopNotificationsEnabled,
                    onToggle: () => void handleNotificationsToggle()
                },
            ]
        },
        {
            title: "Integrations",
            icon: Zap,
            items: [
                { label: "Telegram Bot Sync", value: "Not Connected", type: "button", action: "Connect", onClick: () => alert("Telegram Bot integration coming soon!") },
                { label: "Calendar Sync", value: calendarSync ? "Enabled" : "Disabled", type: "toggle", active: calendarSync, onToggle: () => setCalendarSync(!calendarSync) },
            ]
        },
        {
            title: "Account & Data",
            icon: Shield,
            items: [
                { label: "Cloud Sync", value: cloudSync ? "Active" : "Paused", type: "toggle", active: cloudSync, onToggle: () => setCloudSync(!cloudSync) },
                { label: "Export Session History", value: "CSV", type: "button", action: "Download", onClick: () => alert("Export feature coming soon!") },
            ]
        }
    ];

    return (
        <div className="min-h-screen p-8 md:p-12 lg:p-16 max-w-4xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12"
            >
                <h1 className="text-3xl font-bold text-[var(--ff-text-primary)] mb-2 font-mono">
                    Settings
                </h1>
                <p className="text-[var(--ff-text-secondary)]">
                    Customize your experience and preferences.
                </p>
            </motion.div>

            {saveStatus !== "idle" && (
                <div className="mb-4 text-right text-xs text-[var(--ff-text-tertiary)]">
                    {saveStatus === "saving" && "Saving profile settings..."}
                    {saveStatus === "saved" && "Profile settings saved"}
                    {saveStatus === "error" && "Could not save profile settings"}
                </div>
            )}

            <div className="space-y-8">
                {settingsGroups.map((group, groupIndex) => (
                    <motion.div
                        key={group.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: groupIndex * 0.1 }}
                        className="glass p-6 md:p-8 rounded-3xl border border-[var(--ff-border)]"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-[10px] bg-[var(--ff-bg-elevated)] flex items-center justify-center border border-[var(--ff-border)]">
                                <group.icon className="w-5 h-5 text-[var(--ff-emerald)]" />
                            </div>
                            <h2 className="text-xl font-bold text-[var(--ff-text-primary)]">
                                {group.title}
                            </h2>
                        </div>

                        <div className="space-y-1 div-divide-y">
                            {group.items.map((item: SettingItem) => (
                                <div key={item.label} className="flex flex-col md:flex-row md:items-center justify-between py-4 border-b border-[var(--ff-border)] last:border-0 last:pb-0">
                                    <div className="mb-3 md:mb-0">
                                        <p className="font-medium text-[var(--ff-text-primary)]">{item.label}</p>
                                        <p className="text-sm text-[var(--ff-text-secondary)] mt-0.5">{item.value}</p>
                                    </div>

                                    <div className="flex items-center md:justify-end min-w-[200px]">
                                        {item.type === "slider" && (
                                            <Slider
                                                value={item.currentValue}
                                                onValueChange={item.onChange}
                                                max={item.max}
                                                min={item.min}
                                                step={1}
                                                className="w-full"
                                                style={{ "--slider-track": "var(--ff-glass-03)", "--slider-range": "var(--ff-emerald)" } as React.CSSProperties}
                                            />
                                        )}

                                        {item.type === "toggle" && (
                                            <button
                                                onClick={item.onToggle}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${item.active ? 'bg-[var(--ff-emerald)]' : 'bg-[var(--ff-glass-03)]'}`}
                                            >
                                                <span
                                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${item.active ? 'translate-x-6' : 'translate-x-1'}`}
                                                />
                                            </button>
                                        )}

                                        {item.type === "button" && (
                                            <button
                                                onClick={item.onClick}
                                                className="px-5 py-2 rounded-xl bg-[var(--ff-glass-02)] hover:bg-[var(--ff-glass-03)] border border-[var(--ff-border)] text-sm font-medium text-[var(--ff-text-primary)] transition-all"
                                            >
                                                {item.action}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                ))}
            </div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-12 text-center"
            >
                <p className="text-xs text-[var(--ff-text-tertiary)] font-mono">
                    FocusFlow v0.1.0 • Built with Next.js
                </p>
            </motion.div>
        </div>
    );
}
