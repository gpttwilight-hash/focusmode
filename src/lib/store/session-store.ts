import { create } from "zustand";
import {
  mergeSessionHistory,
  normalizeSessionHistoryPayload,
  type Session,
} from "@/lib/sessions/session-history";
import { syncSessionHistory } from "@/lib/sessions/session-sync";

export type { Session } from "@/lib/sessions/session-history";
export {
  mergeSessionHistory as mergeSessions,
  normalizeSessionHistoryPayload as parseImportedSessions,
} from "@/lib/sessions/session-history";

export interface DailyStats {
  date: string;
  totalFocusMinutes: number;
  completedSessions: number;
  interruptedSessions: number;
  goalMet: boolean;
}

interface SessionStore {
  sessions: Session[];
  currentSession: Partial<Session> | null;
  isLoading: boolean;
  streak: number;

  addSession: (session: Session) => void;
  importSessions: (sessions: Session[]) => number;
  syncSessions: () => Promise<void>;
  setCurrentSession: (session: Partial<Session> | null) => void;
  loadSessions: () => void;
  getDailyStats: (date: Date) => DailyStats;
  getWeeklyStats: () => DailyStats[];
  getStreak: () => number;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const STORAGE_KEY = "focusflow-sessions";

function loadFromStorage(): Session[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return parsed.map((s: Record<string, unknown>) => ({
      ...s,
      startedAt: new Date(s.startedAt as string),
      endedAt: new Date(s.endedAt as string),
    }));
  } catch {
    return [];
  }
}

function saveToStorage(sessions: Session[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  sessions: [],
  currentSession: null,
  isLoading: false,
  streak: 0,

  addSession: (session) => {
    const sessions = [...get().sessions, { ...session, id: session.id || generateId() }];
    saveToStorage(sessions);
    set({ sessions, streak: get().getStreak() });
    void get().syncSessions();
  },

  importSessions: (importedSessions) => {
    const sessions = mergeSessionHistory(get().sessions, importedSessions);
    const importedCount = sessions.length - get().sessions.length;
    saveToStorage(sessions);
    set({ sessions, streak: get().getStreak() });
    void get().syncSessions();
    return importedCount;
  },

  syncSessions: async () => {
    if (typeof window === "undefined") return;

    try {
      const cloudSessions = await syncSessionHistory(get().sessions);
      if (!cloudSessions) return;

      const sessions = mergeSessionHistory(get().sessions, cloudSessions);
      saveToStorage(sessions);
      set({ sessions, streak: get().getStreak() });
    } catch {
      // Keep local history available offline; the next app open retries.
    }
  },

  setCurrentSession: (session) => set({ currentSession: session }),

  loadSessions: () => {
    const sessions = normalizeSessionHistoryPayload(loadFromStorage());
    set({ sessions, streak: 0 });
    setTimeout(() => {
      const streak = get().getStreak();
      set({ streak });
    }, 0);
  },

  getDailyStats: (date: Date): DailyStats => {
    const { sessions } = get();
    const dateStr = date.toISOString().split("T")[0];
    const daySessions = sessions.filter(
      (s) => s.mode === "focus" && s.startedAt.toISOString().split("T")[0] === dateStr
    );
    const totalFocusMinutes = daySessions.reduce(
      (acc, s) => acc + Math.round(s.actualDuration / 60),
      0
    );
    return {
      date: dateStr,
      totalFocusMinutes,
      completedSessions: daySessions.filter((s) => s.completed).length,
      interruptedSessions: daySessions.filter((s) => s.interrupted).length,
      goalMet: totalFocusMinutes >= 120,
    };
  },

  getWeeklyStats: (): DailyStats[] => {
    const stats: DailyStats[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      stats.push(get().getDailyStats(date));
    }
    return stats;
  },

  getStreak: (): number => {
    const { sessions } = get();
    if (sessions.length === 0) return 0;

    let streak = 0;
    const checkDate = new Date();

    while (true) {
      const dateStr = checkDate.toISOString().split("T")[0];
      const hasSession = sessions.some(
        (s) =>
          s.mode === "focus" &&
          s.completed &&
          s.startedAt.toISOString().split("T")[0] === dateStr
      );
      if (!hasSession) break;
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    return streak;
  },
}));
