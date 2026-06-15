// /api/towns/me
//
//   GET  → { town: { id, slug, name } | null }
//   POST { name, slug? } → { town: { id, slug, name } } on success;
//        4xx with { error: 'slug-taken' | 'slug-invalid' | 'already-onboarded' }

import { NextResponse } from "next/server";

import { getSessionFromCookie } from "@/lib/session";
import { getTownByOwner, pickTown } from "@/lib/town";

export async function GET() {
  const row = await getSessionFromCookie();
  if (!row) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const town = await getTownByOwner(row.user.id);
  return NextResponse.json({
    town: town ? { id: town.id, slug: town.slug, name: town.name } : null,
  });
}

export async function POST(req: Request) {
  const row = await getSessionFromCookie();
  if (!row) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { name?: string; slug?: string };
  try {
    body = (await req.json()) as { name?: string; slug?: string };
  } catch {
    return NextResponse.json({ error: "bad-json" }, { status: 400 });
  }
  if (!body.name || typeof body.name !== "string") {
    return NextResponse.json({ error: "missing-name" }, { status: 400 });
  }

  try {
    const town = await pickTown({
      ownerId: row.user.id,
      name: body.name,
      slug: body.slug,
    });
    return NextResponse.json({
      town: { id: town.id, slug: town.slug, name: town.name },
    });
  } catch (e) {
    const code = (e as { code?: string }).code;
    if (code === "slug-taken" || code === "slug-invalid" || code === "already-onboarded") {
      return NextResponse.json({ error: code }, { status: 409 });
    }
    console.error("[towns/me POST] unexpected", e);
    return NextResponse.json({ error: "server-error" }, { status: 500 });
  }
}
