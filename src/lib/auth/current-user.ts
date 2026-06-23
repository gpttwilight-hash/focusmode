import "server-only";

import { db } from "@/db/client";
import { authSessions, users } from "@/db/schema";
import { and, eq, gt } from "drizzle-orm";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, hashSessionToken, verifySessionToken } from "./session-token";

export type CurrentUser = {
  id: string;
  email: string;
  emailVerifiedAt: Date | null;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const secret = process.env.AUTH_SECRET;

  if (!token || !secret) return null;

  try {
    const payload = await verifySessionToken(token, secret);
    const tokenHash = await hashSessionToken(token);

    const session = await db.query.authSessions.findFirst({
      where: and(
        eq(authSessions.id, payload.sessionId),
        eq(authSessions.tokenHash, tokenHash),
        eq(authSessions.revoked, false),
        gt(authSessions.expiresAt, new Date())
      ),
    });

    if (!session) return null;

    const user = await db.query.users.findFirst({ where: eq(users.id, session.userId) });
    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      emailVerifiedAt: user.emailVerifiedAt,
    };
  } catch {
    return null;
  }
}
