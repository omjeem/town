// Begin the CORE OAuth handshake.
//
// We mint a PKCE pair + random `state`, persist them in OAuthState, then
// redirect the browser to CORE's /oauth/authorize. The matching callback at
// /api/auth/callback is what completes the round trip.

import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  buildAuthorizeUrl,
  generatePkcePair,
  generateState,
  getOAuthConfig,
} from "@/lib/oauth";

const STATE_TTL_MS = 10 * 60 * 1000;

export async function GET(req: NextRequest) {
  const cfg = getOAuthConfig();

  const url = new URL(req.url);
  // Optional `?redirect=/somewhere` lets the caller land back on a specific
  // page after login. Defaults to /. We only honor same-origin relative
  // paths to avoid being abused as an open redirect.
  const rawRedirect = url.searchParams.get("redirect");
  const redirectAfter =
    rawRedirect && rawRedirect.startsWith("/") && !rawRedirect.startsWith("//")
      ? rawRedirect
      : "/";

  const state = generateState();
  const { codeVerifier, codeChallenge } = generatePkcePair();

  await prisma.oAuthState.create({
    data: {
      state,
      codeVerifier,
      redirectAfter,
      expiresAt: new Date(Date.now() + STATE_TTL_MS),
    },
  });

  return NextResponse.redirect(buildAuthorizeUrl(cfg, state, codeChallenge));
}
