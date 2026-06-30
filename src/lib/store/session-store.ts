import { create } from "zustand";

export interface Session {
  id: string;
  userId?: string;
  label: string;
  mode: "focus" | "short_break" | "long_break";
  plannedDuration: number;
  actualDuration: number;
  startedAt: Date;
  endedAt: Date;
  completed: boolean;
  interrupted: boolean;
  audioTrackId?: string;
  synced: boolean;
}

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

function isSessionMode(value: unknown): value is Session["mode"] {
  return value === "focus" || value === "short_break" || value === "long_break";
}

function parseSessionDate(value: unknown) {
  if (typeof value !== "string" && !(value instanceof Date)) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function parseImportedSessions(input: unknown): Session[] {
  if (!Array.isArray(input)) return [];

  return input.flatMap((item): Session[] => {
    if (!item || typeof item !== "object") return [];
    const session = item as Record<string, unknown>;
    const startedAt = parseSessionDate(session.startedAt);
    const endedAt = parseSessionDate(session.endedAt);

    if (
      typeof session.id !== "string" ||
      !isSessionMode(session.mode) ||
      typeof session.plannedDuration !== "number" ||
      typeof session.actualDuration !== "number" ||
      !startedAt ||
      !endedAt
    ) {
      return [];
    }

    return [
      {
        id: session.id,
        userId: typeof session.userId === "string" ? session.userId : undefined,
        label: typeof session.label === "string" ? session.label : "",
        mode: session.mode,
        plannedDuration: Math.max(0, Math.round(session.plannedDuration)),
        actualDuration: Math.max(0, Math.round(session.actualDuration)),
        startedAt,
        endedAt,
        completed: session.completed === true,
        interrupted: session.interrupted === true,
        audioTrackId: typeof session.audioTrackId === "string" ? session.audioTrackId : undefined,
        synced: session.synced === true,
      },
    ];
  });
}

export function mergeSessions(existing: Session[], incoming: Session[]) {
  const sessionsById = new Map(existing.map((session) => [session.id, session]));

  incoming.forEach((session) => {
    if (!sessionsById.has(session.id)) sessionsById.set(session.id, session);
  });

  return Array.from(sessionsById.values()).sort(
    (a, b) => a.startedAt.getTime() - b.startedAt.getTime()
  );
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
  },

  importSessions: (importedSessions) => {
    const sessions = mergeSessions(get().sessions, importedSessions);
    const importedCount = sessions.length - get().sessions.length;
    saveToStorage(sessions);
    set({ sessions, streak: get().getStreak() });
    return importedCount;
  },

  setCurrentSession: (session) => set({ currentSession: session }),

  loadSessions: () => {
    const sessions = loadFromStorage();
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
