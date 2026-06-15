// Resolve a usable CORE access token from a Route Handler request,
// whichever auth mode the caller used:
//
//   • Cookie session — grab the user's stored OAuth access_token (refreshed
//     transparently if it's about to expire).
//   • Bearer PAT — the CLI passes its CORE PAT as `Authorization: Bearer`;
//     we just hand the same token back.
//
// The returned token can be used directly against CORE's /api/v1/* surface
// — same auth header CORE accepts everywhere.

import { cookies } from "next/headers";
import { SESSION_COOKIE, getAccessTokenForSession } from "./session";

function readBearer(req: Request): string | null {
  const header = req.headers.get("authorization");
  if (!header) return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1]!.trim() : null;
}

export async function getCoreToken(req: Request): Promise<string | null> {
  const bearer = readBearer(req);
  if (bearer) return bearer;
  const jar = await cookies();
  const sid = jar.get(SESSION_COOKIE)?.value;
  if (!sid) return null;
  try {
    return await getAccessTokenForSession(sid);
  } catch {
    return null;
  }
}
