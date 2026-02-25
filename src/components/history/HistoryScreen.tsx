"use client";

import { motion } from "framer-motion";
import { useSessionStore, Session } from "@/lib/store/session-store";
import { Timer, Coffee, ZapOff, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

export function HistoryScreen() {
    const { sessions } = useSessionStore();

    // Sort sessions latest first
    const sortedSessions = [...sessions].sort(
        (a, b) => b.startedAt.getTime() - a.startedAt.getTime()
    );

    // Group by date string "YYYY-MM-DD"
    const groupedSessions: Record<string, Session[]> = {};
    sortedSessions.forEach((session) => {
        const dateKey = session.startedAt.toISOString().split("T")[0];
        if (!groupedSessions[dateKey]) {
            groupedSessions[dateKey] = [];
        }
        groupedSessions[dateKey].push(session);
    });

    const getFormatDate = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date().toISOString().split("T")[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

        if (dateString === today) return "Today";
        if (dateString === yesterday) return "Yesterday";
        return format(date, "MMMM d, yyyy");
    };

    const getIcon = (session: Session) => {
        if (session.mode === "focus" && session.completed) return <CheckCircle2 className="w-5 h-5 text-[var(--ff-emerald)]" />;
        if (session.mode === "focus" && !session.completed) return <ZapOff className="w-5 h-5 text-red-400" />;
        return <Coffee className="w-5 h-5 text-blue-400" />;
    };

    const getBgColor = (session: Session) => {
        if (session.mode === "focus" && session.completed) return "bg-[var(--ff-emerald-dim)] border-[var(--ff-border-accent)]";
        if (session.mode === "focus" && !session.completed) return "bg-red-500/10 border-red-500/20";
        return "bg-blue-500/10 border-blue-500/20";
    };

    return (
        <div className="min-h-screen p-8 md:p-12 lg:p-16 max-w-4xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12"
            >
                <h1 className="text-3xl font-bold text-[var(--ff-text-primary)] mb-2 font-mono">
                    History
                </h1>
                <p className="text-[var(--ff-text-secondary)]">
                    Review your past focus sessions and breaks.
                </p>
            </motion.div>

            {Object.keys(groupedSessions).length === 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="glass p-12 rounded-3xl border border-[var(--ff-border)] flex flex-col items-center justify-center text-center"
                >
                    <div className="w-16 h-16 rounded-2xl bg-[var(--ff-glass-03)] flex items-center justify-center mb-4">
                        <Timer className="w-8 h-8 text-[var(--ff-text-tertiary)]" />
                    </div>
                    <h3 className="text-xl font-medium text-[var(--ff-text-primary)] mb-2">No History Yet</h3>
                    <p className="text-[var(--ff-text-secondary)]">Complete a timer session to see it here.</p>
                </motion.div>
            ) : (
                <div className="space-y-12">
                    {Object.entries(groupedSessions).map(([date, daySessions], dayIndex) => (
                        <motion.div
                            key={date}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: dayIndex * 0.1 }}
                        >
                            <h2 className="text-sm font-semibold text-[var(--ff-text-tertiary)] uppercase tracking-wider mb-4">
                                {getFormatDate(date)}
                            </h2>
                            <div className="space-y-3">
                                {daySessions.map((session, i) => (
                                    <motion.div
                                        key={session.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: (dayIndex * 0.1) + (i * 0.05) }}
                                        className={`p-4 rounded-2xl border ${getBgColor(session)} flex items-center justify-between backdrop-blur-md`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-[var(--ff-bg-elevated)] flex items-center justify-center shadow-sm">
                                                {getIcon(session)}
                                            </div>
                                            <div>
                                                <p className="font-medium text-[var(--ff-text-primary)] w-32 truncate sm:w-auto">
                                                    {session.label || (session.mode === "focus" ? "Focus Session" : "Break")}
                                                </p>
                                                <p className="text-xs text-[var(--ff-text-secondary)] mt-0.5 tabular-nums">
                                                    {format(new Date(session.startedAt), "HH:mm")} - {format(new Date(session.endedAt), "HH:mm")}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <p className="text-lg font-mono font-medium text-[var(--ff-text-primary)]">
                                                {Math.floor(session.actualDuration / 60)}<span className="text-sm text-[var(--ff-text-secondary)] ml-0.5">m</span>
                                                {" "}
                                                {session.actualDuration % 60}<span className="text-sm text-[var(--ff-text-secondary)] ml-0.5">s</span>
                                            </p>
                                            <p className="text-[10px] text-[var(--ff-text-tertiary)] uppercase tracking-wide mt-1">
                                                {session.completed ? "Completed" : "Interrupted"}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
