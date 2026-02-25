"use client";

import { motion } from "framer-motion";
import { useSessionStore } from "@/lib/store/session-store";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from "recharts";
import { Timer, Zap, Target, Trophy } from "lucide-react";

export function DashboardScreen() {
    const { getWeeklyStats, getStreak, sessions } = useSessionStore();
    const weeklyStats = getWeeklyStats();
    const currentStreak = getStreak();

    const totalCompletedSessions = sessions.filter(
        (s) => s.mode === "focus" && s.completed
    ).length;

    const totalFocusMinutes = sessions
        .filter((s) => s.mode === "focus")
        .reduce((acc, s) => acc + Math.round(s.actualDuration / 60), 0);

    const stats = [
        {
            label: "Current Streak",
            value: `${currentStreak} Days`,
            icon: Zap,
            color: "text-orange-500",
            bg: "bg-orange-500/10",
        },
        {
            label: "Total Focus Time",
            value: `${Math.floor(totalFocusMinutes / 60)}h ${totalFocusMinutes % 60}m`,
            icon: Timer,
            color: "text-[var(--ff-emerald)]",
            bg: "bg-[var(--ff-emerald-dim)]",
        },
        {
            label: "Sessions Completed",
            value: totalCompletedSessions,
            icon: Target,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
        },
        {
            label: "Daily Goals Met",
            value: weeklyStats.filter((s) => s.goalMet).length,
            icon: Trophy,
            color: "text-yellow-500",
            bg: "bg-yellow-500/10",
        },
    ];

    const chartData = weeklyStats.map((stat) => {
        const date = new Date(stat.date);
        return {
            name: date.toLocaleDateString("en-US", { weekday: "short" }),
            minutes: stat.totalFocusMinutes,
            isToday: stat.date === new Date().toISOString().split("T")[0],
            goalMet: stat.goalMet,
        };
    });

    return (
        <div className="min-h-screen p-8 md:p-12 lg:p-16 max-w-6xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12"
            >
                <h1 className="text-3xl font-bold text-[var(--ff-text-primary)] mb-2 font-mono">
                    Dashboard
                </h1>
                <p className="text-[var(--ff-text-secondary)]">
                    Track your focus journey and productivity streaks.
                </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {stats.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="glass p-6 rounded-2xl border border-[var(--ff-border)] flex items-start gap-4"
                        >
                            <div
                                className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg}`}
                            >
                                <Icon className={`w-6 h-6 ${stat.color}`} />
                            </div>
                            <div>
                                <p className="text-sm text-[var(--ff-text-secondary)] font-medium mb-1">
                                    {stat.label}
                                </p>
                                <p className="text-2xl font-bold text-[var(--ff-text-primary)] font-mono">
                                    {stat.value}
                                </p>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="glass p-8 rounded-3xl border border-[var(--ff-border)]"
            >
                <h2 className="text-xl font-bold text-[var(--ff-text-primary)] mb-8 font-mono">
                    Weekly Focus Activity
                </h2>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: "var(--ff-text-tertiary)", fontSize: 12 }}
                                dy={16}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: "var(--ff-text-tertiary)", fontSize: 12 }}
                                tickFormatter={(value) => `${value}m`}
                            />
                            <Tooltip
                                cursor={{ fill: "var(--ff-glass-03)" }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="glass p-3 rounded-lg border border-[var(--ff-border)]">
                                                <p className="text-sm font-medium text-[var(--ff-text-primary)] mb-1">
                                                    {payload[0].payload.name}
                                                </p>
                                                <p className="text-sm text-[var(--ff-emerald)] font-mono">
                                                    {payload[0].value} mins focused
                                                </p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Bar dataKey="minutes" radius={[6, 6, 6, 6]}>
                                {chartData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.isToday ? "var(--ff-emerald)" : "var(--ff-glass-05)"}
                                        className="transition-all duration-300 hover:brightness-110"
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>
        </div>
    );
}
