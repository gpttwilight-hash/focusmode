"use client";

import { motion } from "framer-motion";
import { Timer, Bell, Shield, Zap, Volume2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";

export function SettingsScreen() {
    const settingsGroups = [
        {
            title: "Focus & Break Lengths",
            icon: Timer,
            items: [
                { label: "Focus Duration", value: "25 min", type: "slider", min: 10, max: 90, def: 25 },
                { label: "Short Break", value: "5 min", type: "slider", min: 1, max: 15, def: 5 },
                { label: "Long Break", value: "15 min", type: "slider", min: 5, max: 30, def: 15 },
            ]
        },
        {
            title: "Audio & Notifications",
            icon: Volume2,
            items: [
                { label: "Timer Sounds", value: "Enabled", type: "toggle", active: true },
                { label: "Ambient Music", value: "Enabled", type: "toggle", active: true },
                { label: "Desktop Notifications", value: "Disabled", type: "toggle", active: false },
            ]
        },
        {
            title: "Integrations",
            icon: Zap,
            items: [
                { label: "Telegram Bot Sync", value: "Not Connected", type: "button", action: "Connect" },
                { label: "Calendar Sync", value: "Disabled", type: "toggle", active: false },
            ]
        },
        {
            title: "Account & Data",
            icon: Shield,
            items: [
                { label: "Cloud Sync", value: "Active", type: "toggle", active: true },
                { label: "Export Session History", value: "CSV", type: "button", action: "Download" },
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
                            {group.items.map((item, i) => (
                                <div key={item.label} className="flex flex-col md:flex-row md:items-center justify-between py-4 border-b border-[var(--ff-border)] last:border-0 last:pb-0">
                                    <div className="mb-3 md:mb-0">
                                        <p className="font-medium text-[var(--ff-text-primary)]">{item.label}</p>
                                        <p className="text-sm text-[var(--ff-text-secondary)] mt-0.5">{item.value}</p>
                                    </div>

                                    <div className="flex items-center md:justify-end min-w-[200px]">
                                        {item.type === "slider" && (
                                            <Slider
                                                defaultValue={[(item as any).def!]}
                                                max={(item as any).max!}
                                                min={(item as any).min!}
                                                step={1}
                                                className="w-full"
                                                style={{ "--slider-track": "var(--ff-glass-03)", "--slider-range": "var(--ff-emerald)" } as React.CSSProperties}
                                            />
                                        )}

                                        {item.type === "toggle" && (
                                            <button
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${(item as any).active ? 'bg-[var(--ff-emerald)]' : 'bg-[var(--ff-glass-03)]'}`}
                                            >
                                                <span
                                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${(item as any).active ? 'translate-x-6' : 'translate-x-1'}`}
                                                />
                                            </button>
                                        )}

                                        {item.type === "button" && (
                                            <button className="px-5 py-2 rounded-xl bg-[var(--ff-glass-02)] hover:bg-[var(--ff-glass-03)] border border-[var(--ff-border)] text-sm font-medium text-[var(--ff-text-primary)] transition-all">
                                                {(item as any).action}
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
