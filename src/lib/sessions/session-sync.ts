import {
  normalizeSessionHistoryPayload,
  serializeSession,
  type Session,
} from "./session-history";

export async function syncSessionHistory(sessions: Session[]): Promise<Session[] | null> {
  const response = await fetch("/api/sessions", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sessions.map(serializeSession)),
  });

  if (response.status === 401) return null;
  if (!response.ok) throw new Error("Unable to sync session history");

  return normalizeSessionHistoryPayload(await response.json());
}
