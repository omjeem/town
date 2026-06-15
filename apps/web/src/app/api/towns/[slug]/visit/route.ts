// POST /api/towns/[slug]/visit
// Body: { name, code }
//
// Validates the visitor's code against the town's active share code. On
// success drops a per-slug cookie holding the visitor's display name so
// they don't have to re-enter on subsequent visits. On failure returns
// 401 (so the gate UI can highlight the code field).
//
// The cookie is intentionally unsigned — visitor view is strictly read-
// only, so tampering only changes the display name a visitor uses for
// themselves. The code check is what actually gates entry.

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getTownBySlug } from "@/lib/town";
import { normalizeCode, visitorCookieName } from "@/lib/town-code";

type Params = { slug: string };

const VISITOR_COOKIE_TTL_S = 60 * 60 * 24 * 30; // 30 days

export async function POST(req: Request, ctx: { params: Promise<Params> }) {
  const { slug } = await ctx.params;

  let body: { name?: string; code?: string };
  try {
    body = (await req.json()) as { name?: string; code?: string };
  } catch {
    return NextResponse.json({ error: "bad-json" }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  const code = normalizeCode(body.code ?? "");
  if (!name || name.length > 64) {
    return NextResponse.json({ error: "missing-name" }, { status: 400 });
  }
  if (!code) {
    return NextResponse.json({ error: "missing-code" }, { status: 400 });
  }

  const town = await getTownBySlug(slug);
  if (!town) return NextResponse.json({ error: "not-found" }, { status: 404 });
  if (town.shareCode !== code) {
    return NextResponse.json({ error: "bad-code" }, { status: 401 });
  }

  const jar = await cookies();
  jar.set(
    visitorCookieName(slug),
    JSON.stringify({ n: name, c: town.shareCode }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: VISITOR_COOKIE_TTL_S,
    },
  );

  return NextResponse.json({ ok: true });
}
