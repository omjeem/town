// GET /api/towns/[slug]
// Public lookup. Returns minimal town info — enough for the visitor gate
// to greet by name. No share code, no owner email, nothing private.

import { NextResponse } from "next/server";

import { getTownBySlug } from "@/lib/town";
import { getSessionFromCookie } from "@/lib/session";

type Params = { slug: string };

export async function GET(_req: Request, ctx: { params: Promise<Params> }) {
  const { slug } = await ctx.params;
  const town = await getTownBySlug(slug);
  if (!town) {
    return NextResponse.json({ error: "not-found" }, { status: 404 });
  }

  const session = await getSessionFromCookie();
  const isOwner = !!session && session.user.id === town.ownerId;

  return NextResponse.json({
    slug: town.slug,
    name: town.name,
    isOwner,
  });
}
