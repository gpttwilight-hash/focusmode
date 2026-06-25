import { db } from "@/db/client";
import { googleAccounts, users } from "@/db/schema";
import { createAuthCookie } from "@/lib/auth/cookies";
import {
  exchangeGoogleCode,
  GOOGLE_OAUTH_STATE_COOKIE,
} from "@/lib/auth/google-oauth";
import type { VerifiedGoogleProfile } from "@/lib/auth/google-profile";
import { eq, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const oauthPasswordMarker = "oauth:google";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const url = request.nextUrl;
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(GOOGLE_OAUTH_STATE_COOKIE)?.value;
  const receivedState = url.searchParams.get("state");
  const code = url.searchParams.get("code");

  cookieStore.delete(GOOGLE_OAUTH_STATE_COOKIE);

  if (url.searchParams.get("error")) {
    return redirectToLogin(request);
  }

  if (!expectedState || !receivedState || expectedState !== receivedState || !code) {
    return redirectToLogin(request);
  }

  try {
    const profile = await exchangeGoogleCode({
      code,
      origin: request.nextUrl.origin,
    });
    const userId = await findOrCreateGoogleUser(profile);

    await createAuthCookie(userId);
  } catch (error) {
    console.error("Google sign-in failed", error);
    return redirectToLogin(request);
  }

  return NextResponse.redirect(new URL("/", request.url));
}

async function findOrCreateGoogleUser(profile: VerifiedGoogleProfile): Promise<string> {
  await ensureGoogleAccountsTable();

  const existingAccount = await db.query.googleAccounts.findFirst({
    where: eq(googleAccounts.googleSubject, profile.subject),
  });

  if (existingAccount) {
    return existingAccount.userId;
  }

  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, profile.email),
  });
  const user =
    existingUser ??
    (
      await db
        .insert(users)
        .values({
          email: profile.email,
          passwordHash: oauthPasswordMarker,
          emailVerifiedAt: new Date(),
        })
        .returning()
    )[0];

  if (!user.emailVerifiedAt) {
    await db
      .update(users)
      .set({ emailVerifiedAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, user.id));
  }

  await db.insert(googleAccounts).values({
    userId: user.id,
    googleSubject: profile.subject,
    email: profile.email,
  });

  return user.id;
}

async function ensureGoogleAccountsTable(): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "google_accounts" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "user_id" uuid NOT NULL REFERENCES "public"."users"("id") ON DELETE cascade,
      "google_subject" text NOT NULL UNIQUE,
      "email" varchar(320) NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL
    )
  `);
}

function redirectToLogin(request: NextRequest): NextResponse {
  return NextResponse.redirect(new URL("/login", request.url));
}
