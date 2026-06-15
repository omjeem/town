// GET /api/towns/[slug]/dm-pending
//
// Returns the set of other-participant keys that have sent the viewer a
// message they haven't answered. The TownGame polls this so it can render
// a "needs reply" pill above each pending sender's character.

import { NextResponse } from "next/server";

import { listPendingForViewer } from "@/lib/conversation";
import { resolveViewer } from "@/lib/viewer";

type Params = { slug: string };

export async function GET(_req: Request, ctx: { params: Promise<Params> }) {
  const { slug } = await ctx.params;
  const viewer = await resolveViewer(slug);
  if ("error" in viewer) {
    return NextResponse.json(
      { error: viewer.error },
      { status: viewer.error === "forbidden" ? 403 : 404 },
    );
  }
  const rows = await listPendingForViewer(viewer.town.id, viewer.participantKey);
  return NextResponse.json({
    pending: rows.map((r) => ({
      otherKey: r.otherKey,
      lastMessageAt: r.lastMessageAt.toISOString(),
    })),
  });
}
