// Session helpers used by Route Handlers.
//
// The browser cookie holds an opaque session id. The matching `Session` row
// in Postgres holds the CORE access/refresh tokens and an `expiresAt`. Any
// CORE call from a Route Handler resolves the session id → row → access
// token, refreshing the token first if it's about to expire.

import { cookies } from "next/headers";
import { prisma } from "./db";
import {
  getOAuthConfig,
  refreshAccessToken,
  type TokenResponse,
} from "./oauth";

export const SESSION_COOKIE = "core-town:sid";

// 30 days for the session row + cookie. Access token gets refreshed within
// this window as needed.
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

// Refresh the access token if it's within REFRESH_SKEW_MS of expiry. Keeps
// us from making a CORE call with a token that expires mid-flight.
const REFRESH_SKEW_MS = 60 * 1000;

export type SessionRow = Awaited<ReturnType<typeof loadSessionRow>>;

async function loadSessionRow(sid: string) {
  return prisma.session.findUnique({
    where: { id: sid },
    include: { user: true },
  });
}

export async function getSessionFromCookie() {
  const jar = await cookies();
  const sid = jar.get(SESSION_COOKIE)?.value;
  if (!sid) return null;
  const row = await loadSessionRow(sid);
  if (!row) return null;
  if (row.expiresAt.getTime() < Date.now()) {
    await prisma.session.delete({ where: { id: sid } }).catch(() => {});
    return null;
  }
  return row;
}

export async function setSessionCookie(sid: string) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, sid, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

type CreateSessionInput = {
  userId: string;
  tokens: TokenResponse;
};

export async function createSession({ userId, tokens }: CreateSessionInput) {
  const now = Date.now();
  const tokenExpiresAt = new Date(
    now + ((tokens.expires_in ?? 3600) * 1000),
  );
  const expiresAt = new Date(now + SESSION_TTL_MS);

  return prisma.session.create({
    data: {
      userId,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? null,
      tokenExpiresAt,
      expiresAt,
    },
  });
}

// Returns a usable access token for the given session, refreshing it first
// if it's about to expire and we have a refresh_token. Throws if we don't
// have a way to refresh and the token is already dead.
export async function getAccessTokenForSession(sid: string): Promise<string> {
  const row = await prisma.session.findUnique({ where: { id: sid } });
  if (!row) throw new Error("session not found");

  const nowMs = Date.now();
  const expiresIn = row.tokenExpiresAt.getTime() - nowMs;

  if (expiresIn > REFRESH_SKEW_MS) {
    await prisma.session.update({
      where: { id: sid },
      data: { lastUsedAt: new Date(nowMs) },
    });
    return row.accessToken;
  }

  if (!row.refreshToken) {
    throw new Error("access token expired and no refresh token available");
  }

  const cfg = getOAuthConfig();
  const tokens = await refreshAccessToken(cfg, row.refreshToken);
  const newExpiresAt = new Date(
    nowMs + ((tokens.expires_in ?? 3600) * 1000),
  );
  await prisma.session.update({
    where: { id: sid },
    data: {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? row.refreshToken,
      tokenExpiresAt: newExpiresAt,
      lastUsedAt: new Date(nowMs),
    },
  });
  return tokens.access_token;
}
