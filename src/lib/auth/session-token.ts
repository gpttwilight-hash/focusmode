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
