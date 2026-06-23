"use server";

import { randomUUID } from "node:crypto";
import { db } from "@/db/client";
import { authSessions, emailVerificationCodes, users } from "@/db/schema";
import { getEmailProvider } from "@/lib/email";
import { and, desc, eq, isNull } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { hashPassword, verifyPassword } from "./password";
import { checkRateLimit } from "./rate-limit";
import {
  AUTH_COOKIE_NAME,
  createSessionToken,
  hashSessionToken,
} from "./session-token";
import {
  createCodeExpiry,
  generateVerificationCode,
  hashRateLimitKey,
  hashVerificationCode,
  isCodeExpired,
  normalizeEmail,
  verifyVerificationCode,
} from "./verification-code";

const registerSchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(8).max(128),
});

const verifySchema = z.object({
  email: z.string().email().max(320),
  code: z.string().regex(/^[0-9]{6}$/),
});

const loginSchema = registerSchema;

export type ActionState = {
  ok: boolean;
  message: string;
};

async function getClientIp(): Promise<string> {
  const h = await headers();

  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}

function requireAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;

  if (!secret || secret.length < 24) {
    throw new Error("AUTH_SECRET must be set to at least 24 characters.");
  }

  return secret;
}

export async function registerAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { ok: false, message: "Enter a valid email and a password with at least 8 characters." };
  }

  const email = normalizeEmail(parsed.data.email);
  const rateKey = `register:${hashRateLimitKey(`${await getClientIp()}:${email}`)}`;

  if (!checkRateLimit({ key: rateKey, limit: 5, windowMs: 60 * 60 * 1000 })) {
    return { ok: false, message: "Too many attempts. Please try again later." };
  }

  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });

  if (existing?.emailVerifiedAt) {
    return { ok: false, message: "An account with this email already exists." };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const user =
    existing ??
    (
      await db
        .insert(users)
        .values({ email, passwordHash })
        .returning()
    )[0];

  if (existing && !existing.emailVerifiedAt) {
    await db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, existing.id));
  }

  await sendVerificationCode(user.id, email);
  redirect(`/verify-email?email=${encodeURIComponent(email)}`);
}

export async function resendVerificationAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = normalizeEmail(String(formData.get("email") || ""));
  const parsed = z.string().email().safeParse(email);

  if (!parsed.success) {
    return { ok: false, message: "Enter a valid email address." };
  }

  const rateKey = `resend:${hashRateLimitKey(`${await getClientIp()}:${email}`)}`;

  if (!checkRateLimit({ key: rateKey, limit: 3, windowMs: 15 * 60 * 1000 })) {
    return { ok: false, message: "Please wait before requesting another code." };
  }

  const user = await db.query.users.findFirst({ where: eq(users.email, email) });

  if (!user || user.emailVerifiedAt) {
    return { ok: true, message: "If this email needs verification, a new code has been sent." };
  }

  await sendVerificationCode(user.id, email);
  return { ok: true, message: "A new code has been sent." };
}

export async function verifyEmailAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = verifySchema.safeParse({
    email: formData.get("email"),
    code: formData.get("code"),
  });

  if (!parsed.success) {
    return { ok: false, message: "Enter the 6-digit code from your email." };
  }

  const email = normalizeEmail(parsed.data.email);
  const user = await db.query.users.findFirst({ where: eq(users.email, email) });

  if (!user) {
    return { ok: false, message: "No account exists for this email." };
  }

  const verification = await db.query.emailVerificationCodes.findFirst({
    where: and(
      eq(emailVerificationCodes.userId, user.id),
      isNull(emailVerificationCodes.consumedAt)
    ),
    orderBy: desc(emailVerificationCodes.createdAt),
  });

  if (!verification || isCodeExpired(verification.expiresAt)) {
    return { ok: false, message: "This code expired. Request a new one." };
  }

  if (verification.attempts >= 5) {
    return { ok: false, message: "Too many incorrect attempts. Request a new code." };
  }

  const codeMatches = await verifyVerificationCode(parsed.data.code, verification.codeHash);

  if (!codeMatches) {
    await db
      .update(emailVerificationCodes)
      .set({ attempts: verification.attempts + 1 })
      .where(eq(emailVerificationCodes.id, verification.id));

    return { ok: false, message: "That code is not correct." };
  }

  await db
    .update(emailVerificationCodes)
    .set({ consumedAt: new Date() })
    .where(eq(emailVerificationCodes.id, verification.id));
  await db
    .update(users)
    .set({ emailVerifiedAt: new Date(), updatedAt: new Date() })
    .where(eq(users.id, user.id));
  await createAuthCookie(user.id);
  redirect("/");
}

export async function loginAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { ok: false, message: "Enter your email and password." };
  }

  const email = normalizeEmail(parsed.data.email);
  const user = await db.query.users.findFirst({ where: eq(users.email, email) });

  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return { ok: false, message: "Email or password is incorrect." };
  }

  if (!user.emailVerifiedAt) {
    await sendVerificationCode(user.id, email);
    redirect(`/verify-email?email=${encodeURIComponent(email)}`);
  }

  await createAuthCookie(user.id);
  redirect("/");
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (token) {
    await db
      .update(authSessions)
      .set({ revoked: true })
      .where(eq(authSessions.tokenHash, await hashSessionToken(token)));
  }

  cookieStore.delete(AUTH_COOKIE_NAME);
  redirect("/login");
}

async function sendVerificationCode(userId: string, email: string): Promise<void> {
  const code = generateVerificationCode();
  const codeHash = await hashVerificationCode(code);

  await db.insert(emailVerificationCodes).values({
    userId,
    email,
    codeHash,
    expiresAt: createCodeExpiry(),
  });

  await getEmailProvider().sendVerificationCode({ to: email, code });
}

async function createAuthCookie(userId: string): Promise<void> {
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
