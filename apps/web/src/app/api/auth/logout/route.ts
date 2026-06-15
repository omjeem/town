// Logout: drop the Session row and clear the cookie. We do NOT call CORE
// to revoke the access token — its lifetime is short and CORE controls
// revocation at the source if needed.

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE, clearSessionCookie } from "@/lib/session";

export async function POST() {
  const jar = await cookies();
  const sid = jar.get(SESSION_COOKIE)?.value;
  if (sid) {
    await prisma.session.delete({ where: { id: sid } }).catch(() => {});
  }
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
