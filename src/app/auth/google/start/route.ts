import {
  createGoogleAuthorizationUrl,
  createGoogleOAuthState,
  GOOGLE_OAUTH_STATE_COOKIE,
} from "@/lib/auth/google-oauth";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const state = createGoogleOAuthState();
  const cookieStore = await cookies();

  cookieStore.set(GOOGLE_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 10 * 60,
  });

  return NextResponse.redirect(
    createGoogleAuthorizationUrl({
      origin: request.nextUrl.origin,
      state,
    })
  );
}
