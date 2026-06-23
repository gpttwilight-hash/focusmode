# FocusFlow Cloud Auth Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the first cloud foundation for FocusFlow: Postgres schema, Drizzle setup, normal email/password registration, email-code verification, secure session cookies, and development-mode verification email logging.

**Architecture:** Keep the current timer UI untouched and add a focused server-side auth/data layer. Drizzle owns schema and migrations, pure auth helpers own password/code/session behavior, and route handlers/server actions connect UI forms to the database. Email delivery goes through a small provider interface so dev logging works now and Resend can be connected when a domain/API key exists.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Postgres, Drizzle ORM, bcryptjs, zod, jose, Vitest, Resend-ready email provider interface.

---

## Scope

This plan implements the first milestone from `docs/superpowers/specs/2026-06-23-focusflow-cloud-extension-mvp-design.md`.

Included:

- Dependency and script setup.
- Postgres schema for users, verification codes, and session cookies.
- Pure auth helpers with unit tests.
- Dev email provider that logs verification codes.
- Registration, verification, login, and logout server actions.
- Minimal auth pages matching the existing FocusFlow design.

Not included:

- Moving timer sessions from `localStorage` into Postgres.
- Activity tagging.
- YouTube music library.
- Dashboard updates.
- Chrome extension.
- Production Resend setup with a real domain.

## File Structure

- `package.json`
  Add dependencies and scripts for Drizzle and Vitest.

- `vitest.config.ts`
  Unit-test config for server-side helper tests.

- `drizzle.config.ts`
  Drizzle Kit config reading `DATABASE_URL`.

- `src/db/schema.ts`
  Drizzle table definitions for auth foundation.

- `src/db/client.ts`
  Server-only Drizzle client.

- `src/lib/auth/password.ts`
  Password hash and verification helpers.

- `src/lib/auth/verification-code.ts`
  Six-digit code generation, hashing, comparison, and expiry helpers.

- `src/lib/auth/session-token.ts`
  Signed cookie token creation and verification.

- `src/lib/auth/rate-limit.ts`
  Small in-memory rate limiter for local/dev and first MVP protection.

- `src/lib/auth/actions.ts`
  Server actions for register, verify email, login, logout, resend verification.

- `src/lib/auth/current-user.ts`
  Server helper to read the current signed-in user from cookies.

- `src/lib/email/types.ts`
  Email provider interface.

- `src/lib/email/dev-provider.ts`
  Development provider that logs branded email payloads and codes.

- `src/lib/email/resend-provider.ts`
  Resend provider wrapper. It should be safe to import only server-side.

- `src/lib/email/index.ts`
  Selects dev provider unless `RESEND_API_KEY` and `EMAIL_FROM` are present.

- `src/app/(auth)/layout.tsx`
  Auth-page shell using the existing FocusFlow visual language.

- `src/app/(auth)/register/page.tsx`
  Registration form.

- `src/app/(auth)/verify-email/page.tsx`
  Verification code form.

- `src/app/(auth)/login/page.tsx`
  Login form.

- `src/app/(app)/layout.tsx`
  Optionally show auth status/sign-out in an unobtrusive place only if it can fit without visual clutter. If it cannot fit cleanly, leave app layout unchanged for this milestone.

- `src/lib/auth/*.test.ts`
  Unit tests for pure helper behavior.

## Task 1: Add Tooling And Dependencies

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

- [ ] **Step 1: Install packages**

Run:

```bash
npm install drizzle-orm pg dotenv bcryptjs zod jose resend
npm install -D drizzle-kit tsx @types/pg vitest
```

Expected: npm updates `package.json` and `package-lock.json` without peer dependency errors.

- [ ] **Step 2: Update scripts**

Modify `package.json` scripts to include:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "test": "vitest run",
    "test:watch": "vitest",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push"
  }
}
```

- [ ] **Step 3: Create Vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    passWithNoTests: true,
  },
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
    },
  },
});
```

- [ ] **Step 4: Run baseline checks**

Run:

```bash
npm run lint
npm test
```

Expected:

- `npm run lint` passes or reports only pre-existing issues.
- `npm test` exits successfully with "No test files found" or equivalent Vitest no-tests output.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "chore: add auth foundation tooling"
```

## Task 2: Add Drizzle Schema And Database Client

**Files:**
- Create: `drizzle.config.ts`
- Create: `src/db/schema.ts`
- Create: `src/db/client.ts`

- [ ] **Step 1: Create Drizzle config**

Create `drizzle.config.ts`:

```ts
import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

- [ ] **Step 2: Create schema**

Create `src/db/schema.ts`:

```ts
import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const emailVerificationCodes = pgTable("email_verification_codes", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  email: varchar("email", { length: 320 }).notNull(),
  codeHash: text("code_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  attempts: integer("attempts").default(0).notNull(),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const authSessions = pgTable("auth_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  revoked: boolean("revoked").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
```

- [ ] **Step 3: Create database client**

Create `src/db/client.ts`:

```ts
import "server-only";

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required for database access.");
}

const globalForDb = globalThis as unknown as {
  focusflowPool?: Pool;
};

const pool =
  globalForDb.focusflowPool ??
  new Pool({
    connectionString,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.focusflowPool = pool;
}

export const db = drizzle(pool, { schema });
```

- [ ] **Step 4: Generate migration**

Run:

```bash
npm run db:generate
```

Expected: a new SQL migration appears under `drizzle/`.

If `DATABASE_URL` is not present, `drizzle-kit generate` should still work because it reads schema only. If the command requires env in this version, create a local `.env` with a placeholder only for generation:

```bash
DATABASE_URL=postgres://user:password@localhost:5432/focusflow
```

- [ ] **Step 5: Run checks**

Run:

```bash
npm run lint
npm test
```

Expected: both pass.

- [ ] **Step 6: Commit**

```bash
git add drizzle.config.ts drizzle src/db/schema.ts src/db/client.ts
git commit -m "feat: add auth database schema"
```

## Task 3: Add Pure Auth Helper Tests

**Files:**
- Create: `src/lib/auth/password.test.ts`
- Create: `src/lib/auth/verification-code.test.ts`
- Create: `src/lib/auth/session-token.test.ts`

- [ ] **Step 1: Create password helper test**

Create `src/lib/auth/password.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password helpers", () => {
  it("hashes and verifies the original password", async () => {
    const hash = await hashPassword("correct horse battery staple");

    expect(hash).not.toBe("correct horse battery staple");
    await expect(verifyPassword("correct horse battery staple", hash)).resolves.toBe(true);
    await expect(verifyPassword("wrong password", hash)).resolves.toBe(false);
  });
});
```

- [ ] **Step 2: Create verification-code helper test**

Create `src/lib/auth/verification-code.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  createCodeExpiry,
  generateVerificationCode,
  hashVerificationCode,
  isCodeExpired,
  verifyVerificationCode,
} from "./verification-code";

describe("verification code helpers", () => {
  it("generates a six digit numeric code", () => {
    const code = generateVerificationCode();

    expect(code).toMatch(/^[0-9]{6}$/);
  });

  it("hashes and verifies a code", async () => {
    const hash = await hashVerificationCode("483921");

    expect(hash).not.toBe("483921");
    await expect(verifyVerificationCode("483921", hash)).resolves.toBe(true);
    await expect(verifyVerificationCode("111111", hash)).resolves.toBe(false);
  });

  it("detects expired codes", () => {
    const now = new Date("2026-06-23T12:00:00.000Z");
    const expiresAt = createCodeExpiry(now);

    expect(expiresAt.toISOString()).toBe("2026-06-23T12:10:00.000Z");
    expect(isCodeExpired(expiresAt, new Date("2026-06-23T12:09:59.000Z"))).toBe(false);
    expect(isCodeExpired(expiresAt, new Date("2026-06-23T12:10:00.000Z"))).toBe(true);
  });
});
```

- [ ] **Step 3: Create session token helper test**

Create `src/lib/auth/session-token.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createSessionToken, hashSessionToken, verifySessionToken } from "./session-token";

describe("session token helpers", () => {
  it("creates a signed token and verifies it", async () => {
    const secret = "test-secret-with-enough-length-for-hmac";
    const token = await createSessionToken({
      secret,
      sessionId: "session-1",
      userId: "user-1",
      expiresAt: new Date("2026-06-24T00:00:00.000Z"),
    });

    const payload = await verifySessionToken(token, secret);

    expect(payload.sessionId).toBe("session-1");
    expect(payload.userId).toBe("user-1");
    expect(payload.expiresAt).toBe("2026-06-24T00:00:00.000Z");
  });

  it("hashes token values for database storage", async () => {
    const hash = await hashSessionToken("raw-token");

    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hash).not.toBe("raw-token");
  });
});
```

- [ ] **Step 4: Run tests to verify they fail**

Run:

```bash
npm test
```

Expected: tests fail because `password.ts`, `verification-code.ts`, and `session-token.ts` do not exist.

- [ ] **Step 5: Commit failing tests**

```bash
git add src/lib/auth/*.test.ts
git commit -m "test: add auth helper expectations"
```

## Task 4: Implement Pure Auth Helpers

**Files:**
- Create: `src/lib/auth/password.ts`
- Create: `src/lib/auth/verification-code.ts`
- Create: `src/lib/auth/session-token.ts`

- [ ] **Step 1: Implement password helpers**

Create `src/lib/auth/password.ts`:

```ts
import bcrypt from "bcryptjs";

const PASSWORD_COST = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, PASSWORD_COST);
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}
```

- [ ] **Step 2: Implement verification code helpers**

Create `src/lib/auth/verification-code.ts`:

```ts
import { randomInt, createHash } from "node:crypto";
import bcrypt from "bcryptjs";

const CODE_TTL_MINUTES = 10;
const CODE_HASH_COST = 10;

export function generateVerificationCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export async function hashVerificationCode(code: string): Promise<string> {
  return bcrypt.hash(code, CODE_HASH_COST);
}

export async function verifyVerificationCode(code: string, codeHash: string): Promise<boolean> {
  return bcrypt.compare(code, codeHash);
}

export function createCodeExpiry(now = new Date()): Date {
  return new Date(now.getTime() + CODE_TTL_MINUTES * 60 * 1000);
}

export function isCodeExpired(expiresAt: Date, now = new Date()): boolean {
  return now.getTime() >= expiresAt.getTime();
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function hashRateLimitKey(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
```

- [ ] **Step 3: Implement session token helpers**

Create `src/lib/auth/session-token.ts`:

```ts
import { createHash } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";

export const AUTH_COOKIE_NAME = "focusflow_session";

type CreateSessionTokenInput = {
  secret: string;
  sessionId: string;
  userId: string;
  expiresAt: Date;
};

export type SessionTokenPayload = {
  sessionId: string;
  userId: string;
  expiresAt: string;
};

function getSecretKey(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(input: CreateSessionTokenInput): Promise<string> {
  return new SignJWT({
    sessionId: input.sessionId,
    userId: input.userId,
    expiresAt: input.expiresAt.toISOString(),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(input.expiresAt)
    .sign(getSecretKey(input.secret));
}

export async function verifySessionToken(
  token: string,
  secret: string
): Promise<SessionTokenPayload> {
  const { payload } = await jwtVerify(token, getSecretKey(secret));

  return {
    sessionId: String(payload.sessionId),
    userId: String(payload.userId),
    expiresAt: String(payload.expiresAt),
  };
}

export async function hashSessionToken(token: string): Promise<string> {
  return createHash("sha256").update(token).digest("hex");
}
```

- [ ] **Step 4: Run tests**

Run:

```bash
npm test
```

Expected: all auth helper tests pass.

- [ ] **Step 5: Run lint**

Run:

```bash
npm run lint
```

Expected: lint passes.

- [ ] **Step 6: Commit**

```bash
git add src/lib/auth/password.ts src/lib/auth/verification-code.ts src/lib/auth/session-token.ts
git commit -m "feat: add auth helper utilities"
```

## Task 5: Add Email Provider Boundary

**Files:**
- Create: `src/lib/email/types.ts`
- Create: `src/lib/email/dev-provider.ts`
- Create: `src/lib/email/resend-provider.ts`
- Create: `src/lib/email/index.ts`

- [ ] **Step 1: Create provider types**

Create `src/lib/email/types.ts`:

```ts
export type SendVerificationCodeInput = {
  to: string;
  code: string;
};

export type EmailProvider = {
  sendVerificationCode(input: SendVerificationCodeInput): Promise<void>;
};
```

- [ ] **Step 2: Create dev provider**

Create `src/lib/email/dev-provider.ts`:

```ts
import type { EmailProvider } from "./types";

export const devEmailProvider: EmailProvider = {
  async sendVerificationCode(input) {
    console.info("[FocusFlow email:dev] Verification email");
    console.info(`To: ${input.to}`);
    console.info("Subject: Your FocusFlow verification code");
    console.info(`Code: ${input.code}`);
    console.info("This code expires in 10 minutes.");
  },
};
```

- [ ] **Step 3: Create Resend provider**

Create `src/lib/email/resend-provider.ts`:

```ts
import "server-only";

import { Resend } from "resend";
import type { EmailProvider } from "./types";

export function createResendEmailProvider(apiKey: string, from: string): EmailProvider {
  const resend = new Resend(apiKey);

  return {
    async sendVerificationCode(input) {
      await resend.emails.send({
        from,
        to: input.to,
        subject: "Your FocusFlow verification code",
        html: renderVerificationEmail(input.code),
        text: `Your FocusFlow verification code is ${input.code}. This code expires in 10 minutes.`,
      });
    },
  };
}

function renderVerificationEmail(code: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;background:#080f0e;color:rgba(255,255,255,0.92);font-family:Inter,Arial,sans-serif;">
    <div style="padding:32px 16px;">
      <div style="max-width:440px;margin:0 auto;background:rgba(8,26,22,0.88);border:1px solid rgba(16,185,129,0.25);border-radius:18px;padding:28px;box-shadow:0 18px 60px rgba(0,0,0,0.35);">
        <div style="font-size:13px;letter-spacing:0.16em;text-transform:uppercase;color:#10b981;margin-bottom:18px;">FocusFlow</div>
        <h1 style="font-size:24px;line-height:1.2;margin:0 0 10px;">Verify your email</h1>
        <p style="font-size:14px;line-height:1.6;color:rgba(255,255,255,0.62);margin:0 0 24px;">Use this code to finish creating your FocusFlow account.</p>
        <div style="font-family:'JetBrains Mono','SFMono-Regular',Consolas,monospace;font-size:34px;letter-spacing:0.18em;color:#34d399;background:rgba(16,185,129,0.12);border:1px solid rgba(16,185,129,0.22);border-radius:14px;padding:18px;text-align:center;">${code}</div>
        <p style="font-size:12px;line-height:1.6;color:rgba(255,255,255,0.38);margin:22px 0 0;">This code expires in 10 minutes. If you did not request it, you can ignore this email.</p>
      </div>
    </div>
  </body>
</html>`;
}
```

- [ ] **Step 4: Create provider selector**

Create `src/lib/email/index.ts`:

```ts
import "server-only";

import { devEmailProvider } from "./dev-provider";
import { createResendEmailProvider } from "./resend-provider";
import type { EmailProvider } from "./types";

export function getEmailProvider(): EmailProvider {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (apiKey && from) {
    return createResendEmailProvider(apiKey, from);
  }

  return devEmailProvider;
}
```

- [ ] **Step 5: Run checks**

Run:

```bash
npm run lint
npm test
```

Expected: both pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/email
git commit -m "feat: add verification email provider"
```

## Task 6: Add Auth Server Actions

**Files:**
- Create: `src/lib/auth/rate-limit.ts`
- Create: `src/lib/auth/actions.ts`
- Create: `src/lib/auth/current-user.ts`

- [ ] **Step 1: Create rate limiter**

Create `src/lib/auth/rate-limit.ts`:

```ts
type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

type RateLimitInput = {
  key: string;
  limit: number;
  windowMs: number;
};

export function checkRateLimit(input: RateLimitInput): boolean {
  const now = Date.now();
  const current = buckets.get(input.key);

  if (!current || current.resetAt <= now) {
    buckets.set(input.key, { count: 1, resetAt: now + input.windowMs });
    return true;
  }

  if (current.count >= input.limit) {
    return false;
  }

  current.count += 1;
  return true;
}
```

- [ ] **Step 2: Create auth actions**

Create `src/lib/auth/actions.ts` with this structure:

```ts
"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq, and, desc, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { authSessions, emailVerificationCodes, users } from "@/db/schema";
import { getEmailProvider } from "@/lib/email";
import { hashPassword, verifyPassword } from "./password";
import {
  createCodeExpiry,
  generateVerificationCode,
  hashRateLimitKey,
  hashVerificationCode,
  isCodeExpired,
  normalizeEmail,
  verifyVerificationCode,
} from "./verification-code";
import {
  AUTH_COOKIE_NAME,
  createSessionToken,
  hashSessionToken,
} from "./session-token";
import { checkRateLimit } from "./rate-limit";

const registerSchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(8).max(128),
});

const verifySchema = z.object({
  email: z.string().email().max(320),
  code: z.string().regex(/^[0-9]{6}$/),
});

const loginSchema = registerSchema;

type ActionState = {
  ok: boolean;
  message: string;
};

async function getClientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "local"
  );
}

function requireAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 24) {
    throw new Error("AUTH_SECRET must be set to at least 24 characters.");
  }
  return secret;
}

export async function registerAction(_state: ActionState, formData: FormData): Promise<ActionState> {
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
    await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, existing.id));
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

export async function verifyEmailAction(_state: ActionState, formData: FormData): Promise<ActionState> {
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

  await db.update(emailVerificationCodes).set({ consumedAt: new Date() }).where(eq(emailVerificationCodes.id, verification.id));
  await db.update(users).set({ emailVerifiedAt: new Date(), updatedAt: new Date() }).where(eq(users.id, user.id));
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
  const [session] = await db.insert(authSessions).values({ userId, tokenHash: "pending", expiresAt }).returning();
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
```

- [ ] **Step 3: Create current user helper**

Create `src/lib/auth/current-user.ts`:

```ts
import "server-only";

import { cookies } from "next/headers";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db/client";
import { authSessions, users } from "@/db/schema";
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
```

- [ ] **Step 4: Run checks**

Run:

```bash
npm run lint
npm test
```

Expected: both pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth/actions.ts src/lib/auth/current-user.ts src/lib/auth/rate-limit.ts
git commit -m "feat: add email verification auth actions"
```

## Task 7: Add Auth Pages

**Files:**
- Create: `src/app/(auth)/layout.tsx`
- Create: `src/app/(auth)/register/page.tsx`
- Create: `src/app/(auth)/verify-email/page.tsx`
- Create: `src/app/(auth)/login/page.tsx`

- [ ] **Step 1: Create auth layout**

Create `src/app/(auth)/layout.tsx`:

```tsx
import { AmbientBackground } from "@/components/layout/AmbientBackground";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: "var(--ff-bg)" }}>
      <AmbientBackground />
      <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        {children}
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Create register page**

Create `src/app/(auth)/register/page.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";

const initialState = { ok: false, message: "" };

export default function RegisterPage() {
  const [state, action, pending] = useActionState(registerAction, initialState);

  return (
    <form action={action} className="glass-heavy w-full max-w-sm p-7">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ff-emerald)]">
        FocusFlow
      </p>
      <h1 className="mb-2 text-2xl font-semibold text-[var(--ff-text-primary)]">Create account</h1>
      <p className="mb-6 text-sm leading-6 text-[var(--ff-text-secondary)]">
        Save your focus history, music, and activity stats.
      </p>
      <label className="mb-4 block">
        <span className="mb-2 block text-sm text-[var(--ff-text-secondary)]">Email</span>
        <input name="email" type="email" required className="h-11 w-full rounded-xl border border-[var(--ff-border)] bg-[var(--ff-glass-02)] px-3 text-sm outline-none focus:border-[var(--ff-border-accent)]" />
      </label>
      <label className="mb-4 block">
        <span className="mb-2 block text-sm text-[var(--ff-text-secondary)]">Password</span>
        <input name="password" type="password" minLength={8} required className="h-11 w-full rounded-xl border border-[var(--ff-border)] bg-[var(--ff-glass-02)] px-3 text-sm outline-none focus:border-[var(--ff-border-accent)]" />
      </label>
      {state.message && <p className="mb-4 text-sm text-[var(--ff-error)]">{state.message}</p>}
      <Button className="h-11 w-full rounded-xl" disabled={pending}>
        {pending ? "Creating..." : "Create account"}
      </Button>
      <p className="mt-5 text-center text-sm text-[var(--ff-text-secondary)]">
        Already have an account? <Link className="text-[var(--ff-emerald)]" href="/login">Sign in</Link>
      </p>
    </form>
  );
}
```

- [ ] **Step 3: Create verify page**

Create `src/app/(auth)/verify-email/page.tsx`:

```tsx
"use client";

import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { resendVerificationAction, verifyEmailAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";

const initialState = { ok: false, message: "" };

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [verifyState, verifyAction, verifyPending] = useActionState(verifyEmailAction, initialState);
  const [resendState, resendAction, resendPending] = useActionState(resendVerificationAction, initialState);

  return (
    <div className="glass-heavy w-full max-w-sm p-7">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ff-emerald)]">
        FocusFlow
      </p>
      <h1 className="mb-2 text-2xl font-semibold text-[var(--ff-text-primary)]">Verify email</h1>
      <p className="mb-6 text-sm leading-6 text-[var(--ff-text-secondary)]">
        Enter the 6-digit code sent to {email || "your email"}.
      </p>
      <form action={verifyAction}>
        <input name="email" type="hidden" value={email} />
        <label className="mb-4 block">
          <span className="mb-2 block text-sm text-[var(--ff-text-secondary)]">Code</span>
          <input name="code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required className="h-12 w-full rounded-xl border border-[var(--ff-border)] bg-[var(--ff-glass-02)] px-3 text-center font-mono text-xl tracking-[0.2em] outline-none focus:border-[var(--ff-border-accent)]" />
        </label>
        {verifyState.message && <p className="mb-4 text-sm text-[var(--ff-error)]">{verifyState.message}</p>}
        <Button className="h-11 w-full rounded-xl" disabled={verifyPending}>
          {verifyPending ? "Checking..." : "Verify"}
        </Button>
      </form>
      <form action={resendAction} className="mt-3">
        <input name="email" type="hidden" value={email} />
        <button className="w-full text-sm text-[var(--ff-text-secondary)] hover:text-[var(--ff-emerald)]" disabled={resendPending}>
          {resendPending ? "Sending..." : "Send a new code"}
        </button>
        {resendState.message && <p className="mt-3 text-center text-sm text-[var(--ff-text-secondary)]">{resendState.message}</p>}
      </form>
    </div>
  );
}
```

- [ ] **Step 4: Create login page**

Create `src/app/(auth)/login/page.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";

const initialState = { ok: false, message: "" };

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, initialState);

  return (
    <form action={action} className="glass-heavy w-full max-w-sm p-7">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ff-emerald)]">
        FocusFlow
      </p>
      <h1 className="mb-2 text-2xl font-semibold text-[var(--ff-text-primary)]">Welcome back</h1>
      <p className="mb-6 text-sm leading-6 text-[var(--ff-text-secondary)]">
        Sign in to your focus workspace.
      </p>
      <label className="mb-4 block">
        <span className="mb-2 block text-sm text-[var(--ff-text-secondary)]">Email</span>
        <input name="email" type="email" required className="h-11 w-full rounded-xl border border-[var(--ff-border)] bg-[var(--ff-glass-02)] px-3 text-sm outline-none focus:border-[var(--ff-border-accent)]" />
      </label>
      <label className="mb-4 block">
        <span className="mb-2 block text-sm text-[var(--ff-text-secondary)]">Password</span>
        <input name="password" type="password" required className="h-11 w-full rounded-xl border border-[var(--ff-border)] bg-[var(--ff-glass-02)] px-3 text-sm outline-none focus:border-[var(--ff-border-accent)]" />
      </label>
      {state.message && <p className="mb-4 text-sm text-[var(--ff-error)]">{state.message}</p>}
      <Button className="h-11 w-full rounded-xl" disabled={pending}>
        {pending ? "Signing in..." : "Sign in"}
      </Button>
      <p className="mt-5 text-center text-sm text-[var(--ff-text-secondary)]">
        New here? <Link className="text-[var(--ff-emerald)]" href="/register">Create account</Link>
      </p>
    </form>
  );
}
```

- [ ] **Step 5: Run checks**

Run:

```bash
npm run lint
npm test
```

Expected: both pass.

- [ ] **Step 6: Commit**

```bash
git add 'src/app/(auth)'
git commit -m "feat: add auth screens"
```

## Task 8: Add Minimal Auth Entry Point

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`

- [ ] **Step 1: Update imports**

Modify the icon import in `src/components/layout/Sidebar.tsx`:

```tsx
import { Timer, BarChart3, History, Settings, Zap, UserRound } from "lucide-react";
```

- [ ] **Step 2: Add login link above the streak indicator**

Add this block immediately before the `{/* Streak indicator */}` block:

```tsx
      {/* Account */}
      <div className="relative z-10 mb-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/login"
              className="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--ff-text-tertiary)] hover:text-[var(--ff-text-secondary)] hover:bg-[var(--ff-glass-03)] transition-all duration-200"
            >
              <UserRound className="w-4 h-4" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" className="glass border-[var(--ff-border)]">
            <p className="text-[var(--ff-text-primary)] text-xs">Account</p>
          </TooltipContent>
        </Tooltip>
      </div>
```

Expected: the sidebar keeps the same visual rhythm and adds one small account entry without changing the timer screen.

- [ ] **Step 3: Run checks**

Run:

```bash
npm run lint
npm test
```

Expected: both pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/Sidebar.tsx
git commit -m "feat: expose auth entry points"
```

## Task 9: Run Database Migration And Manual Auth Smoke Test

**Files:**
- No code changes unless previous tasks reveal a bug.

- [ ] **Step 1: Confirm environment**

Ensure `.env.local` or shell environment contains:

```bash
DATABASE_URL=postgres://...
AUTH_SECRET=replace-with-at-least-24-random-characters
```

For this milestone, `RESEND_API_KEY` and `EMAIL_FROM` are not required. Without them, verification emails are logged by the dev provider.

- [ ] **Step 2: Apply migration**

Run:

```bash
npm run db:migrate
```

Expected: Drizzle applies the generated migration to the configured Postgres database.

- [ ] **Step 3: Start dev server**

Run:

```bash
npm run dev
```

Expected: Next.js starts and prints a localhost URL.

- [ ] **Step 4: Manual registration flow**

In the browser:

1. Open `/register`.
2. Enter a test email and password.
3. Submit the form.
4. Confirm it redirects to `/verify-email?email=...`.
5. Read the verification code from the server logs.
6. Enter the code.
7. Confirm it redirects to `/`.
8. Confirm the `focusflow_session` cookie exists and is HTTP-only in browser devtools.

- [ ] **Step 5: Manual login flow**

In the browser:

1. Use `/login`.
2. Enter the verified email and password.
3. Confirm it redirects to `/`.
4. Run logout manually later after a UI control exists, or inspect that `logoutAction` is callable from a future sign-out control.

- [ ] **Step 6: Final checks**

Run:

```bash
npm run lint
npm test
npm run build
```

Expected: all pass.

- [ ] **Step 7: Commit fixes if needed**

If manual testing required fixes:

```bash
git add <changed-files>
git commit -m "fix: stabilize auth foundation"
```

If no fixes were needed:

```bash
git status --short
```

Expected: no uncommitted code changes.

## Self-Review

Spec coverage:

- Email/password registration with verification: Tasks 6 and 7.
- Dev email path without domain: Task 5.
- Resend-ready wrapper: Task 5.
- Postgres schema: Task 2.
- Secure password hashing and signed cookies: Tasks 4 and 6.
- Rate limits and attempt limits: Task 6.
- Existing design preservation: Task 7 uses current glass/emerald styling and does not change the timer.

Known gaps intentionally deferred to later plans:

- Timer sessions in Postgres.
- Activity tagging.
- YouTube music library.
- Dashboard by activity.
- Chrome side panel.
- Production domain setup.

No placeholder tasks are expected in this plan. Each code-producing task names files, exact snippets, commands, and expected results.
