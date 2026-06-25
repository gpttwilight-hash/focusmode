import "server-only";

import { randomUUID } from "node:crypto";
import { db } from "@/db/client";
import { authSessions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import {
  AUTH_COOKIE_NAME,
  createSessionToken,
  hashSessionToken,
} from "./session-token";

function requireAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;

  if (!secret || secret.length < 24) {
    throw new Error("AUTH_SECRET must be set to at least 24 characters.");
  }

  return secret;
}

export async function createAuthCookie(userId: string): Promise<void> {
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const [session] = await db
    .insert(authSessions)
    .values({ userId, tokenHash: `pending:${randomUUID()}`, expiresAt })
    .returning();
  const token = await createSessionToken({
    secret: requireAuthSecret(),
    sessionId: session.id,
    userId,
    expiresAt,
  });
  const tokenHash = await hashSessionToken(token);

  await db.update(authSessions).set({ tokenHash }).where(eq(authSessions.id, session.id));

  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}
