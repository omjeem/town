// GET /api/items/[id]/svg
//
// Public, unauthenticated SVG render of a VisitorItem. The /items/[id]
// viewer page inlines the result; users can also fetch this URL directly
// to download or embed the card.
//
// Caching: 5 minutes — items don't change after issue, but the rendered
// SVG can if the designer edits the template, so we keep the window short.

import { NextResponse } from "next/server";

import { loadVisitorShare } from "@/lib/town-share";

type Params = { id: string };

export async function GET(_req: Request, ctx: { params: Promise<Params> }) {
  const { id } = await ctx.params;
  const loaded = await loadVisitorShare(id);
  if (!loaded) {
    return NextResponse.json({ error: "not-found" }, { status: 404 });
  }
  return new Response(loaded.svg, {
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control": "public, max-age=300, s-maxage=300",
    },
  });
}
