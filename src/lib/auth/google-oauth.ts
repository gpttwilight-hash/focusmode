import "server-only";

import { randomBytes } from "node:crypto";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { toVerifiedGoogleProfile, type VerifiedGoogleProfile } from "./google-profile";

export const GOOGLE_OAUTH_STATE_COOKIE = "focusflow_google_oauth_state";

const googleIssuer = "https://accounts.google.com";
const googleAuthUrl = "https://accounts.google.com/o/oauth2/v2/auth";
const googleTokenUrl = "https://oauth2.googleapis.com/token";
const googleJwks = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

export function createGoogleOAuthState(): string {
  return randomBytes(32).toString("base64url");
}

export function getGoogleRedirectUri(origin: string): string {
  return new URL("/auth/google/callback", origin).toString();
}

export function createGoogleAuthorizationUrl(input: {
  origin: string;
  state: string;
}): URL {
  const clientId = requireGoogleClientId();
  const url = new URL(googleAuthUrl);

  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", getGoogleRedirectUri(input.origin));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", input.state);
  url.searchParams.set("prompt", "select_account");

  return url;
}

export async function exchangeGoogleCode(input: {
  code: string;
  origin: string;
}): Promise<VerifiedGoogleProfile> {
  const response = await fetch(googleTokenUrl, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: requireGoogleClientId(),
      client_secret: requireGoogleClientSecret(),
      code: input.code,
      grant_type: "authorization_code",
      redirect_uri: getGoogleRedirectUri(input.origin),
    }),
  });

  if (!response.ok) {
    throw new Error(`Google token exchange failed with ${response.status}.`);
  }

  const tokenResponse = (await response.json()) as Record<string, unknown>;

  if (typeof tokenResponse.id_token !== "string" || !tokenResponse.id_token) {
    throw new Error("Google token response did not include an ID token.");
  }

  const { payload } = await jwtVerify(tokenResponse.id_token, googleJwks, {
    audience: requireGoogleClientId(),
    issuer: googleIssuer,
  });

  return toVerifiedGoogleProfile(payload);
}

function requireGoogleClientId(): string {
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID is required for Google sign-in.");
  }

  return clientId;
}

function requireGoogleClientSecret(): string {
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientSecret) {
    throw new Error("GOOGLE_CLIENT_SECRET is required for Google sign-in.");
  }

  return clientSecret;
}
