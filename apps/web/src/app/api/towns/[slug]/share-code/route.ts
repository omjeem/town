// /api/towns/[slug]/share-code
//
//   GET  → { code }              (owner only)
//   POST → { code }              (owner only; rotates the code)
//
// Surfaces the active share code so the Share modal can display + copy it,
// and rotates on demand. Non-owners always get 403 — never leak the code.

import { NextResponse } from "next/server";

import { getSessionFromCookie } from "@/lib/session";
import { getTownBySlug, rotateShareCode } from "@/lib/town";

type Params = { slug: string };

async function requireOwnerTown(slug: string) {
  const session = await getSessionFromCookie();
  if (!session) return { error: "unauthorized" as const, status: 401 };
  const town = await getTownBySlug(slug);
  if (!town) return { error: "not-found" as const, status: 404 };
  if (town.ownerId !== session.user.id) {
    return { error: "forbidden" as const, status: 403 };
  }
  return { town };
}

export async function GET(_req: Request, ctx: { params: Promise<Params> }) {
  const { slug } = await ctx.params;
  const result = await requireOwnerTown(slug);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ code: result.town.shareCode });
}

export async function POST(_req: Request, ctx: { params: Promise<Params> }) {
  const { slug } = await ctx.params;
  const result = await requireOwnerTown(slug);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  const updated = await rotateShareCode(result.town.id);
  return NextResponse.json({ code: updated.shareCode });
}
