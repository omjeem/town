// GET /api/towns/[slug]/dm/[other]/subscribe-token
//
// Centrifugo requires a per-channel subscription token for any non-anonymous
// namespace. We mint one scoped to the specific DM channel after verifying
// the viewer is one of the two participants.

import { NextResponse } from "next/server";

import { dmChannel, mintSubscribeToken } from "@/lib/centrifugo";
import { resolveViewer } from "@/lib/viewer";

type Params = { slug: string; other: string };

export async function GET(_req: Request, ctx: { params: Promise<Params> }) {
  const { slug, other } = await ctx.params;
  const viewer = await resolveViewer(slug);
  if ("error" in viewer) {
    return NextResponse.json(
      { error: viewer.error },
      { status: viewer.error === "forbidden" ? 403 : 404 },
    );
  }
  const otherKey = decodeURIComponent(other);
  if (otherKey === viewer.participantKey) {
    return NextResponse.json({ error: "self-dm" }, { status: 400 });
  }

  const channel = dmChannel(slug, viewer.participantKey, otherKey);
  try {
    const token = await mintSubscribeToken({
      sub: viewer.participantKey,
      channel,
    });
    return NextResponse.json({ token, channel });
  } catch (e) {
    console.error("[dm subscribe-token] mint failed", e);
    return NextResponse.json(
      { error: "realtime-disabled" },
      { status: 503 },
    );
  }
}
