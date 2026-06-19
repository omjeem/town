// GET /api/items/[id]/png
//
// Public, unauthenticated PNG render of a VisitorItem. This is the URL
// the /items/[id] viewer page advertises via og:image so Twitter,
// LinkedIn, WhatsApp, etc. (which don't fetch SVG og:image values)
// unfurl share links with the card.
//
// Caching: 5 minutes; same rationale as the SVG route.

import { NextResponse } from "next/server";

import { loadVisitorShare, renderSvgToPng } from "@/lib/town-share";

export const runtime = "nodejs";

type Params = { id: string };

export async function GET(_req: Request, ctx: { params: Promise<Params> }) {
  const { id } = await ctx.params;
  const loaded = await loadVisitorShare(id);
  if (!loaded) {
    return NextResponse.json({ error: "not-found" }, { status: 404 });
  }
  let png: Buffer;
  try {
    png = await renderSvgToPng(loaded.svg);
  } catch (e) {
    return NextResponse.json(
      {
        error: "render-failed",
        detail: e instanceof Error ? e.message : "unknown",
      },
      { status: 500 },
    );
  }
  return new Response(new Uint8Array(png), {
    headers: {
      "content-type": "image/png",
      "cache-control": "public, max-age=300, s-maxage=300",
    },
  });
}
