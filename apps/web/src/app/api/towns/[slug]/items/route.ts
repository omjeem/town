// GET /api/towns/[slug]/items
//
// Returns the calling visitor's VisitorItem rows for this town. Used by
// the in-game HUD badge ("Items: N") and the modal that walks through
// each card with a share button.
//
// Auth: same shape as resolveViewer — owner session or guest visit
// cookie. Owners can't earn items (grant gated in npc-tools), so the
// list is empty for them; the badge in the HUD also hides itself for
// owner-mode, but the endpoint stays generic so future owner-as-visitor
// flows just work.
//
// Caching: no-store. Items appear in real time when an NPC issues one.

import { NextResponse } from "next/server";

import { resolveViewer } from "@/lib/viewer";
import { prisma } from "@/lib/db";
import { loadTownCatalog } from "@/lib/town-tools";

type Params = { slug: string };

interface ItemWire {
  id: string;
  templateId: string;
  templateLabel: string;
  createdAt: string;
}

export async function GET(_req: Request, ctx: { params: Promise<Params> }) {
  const { slug } = await ctx.params;
  const view = await resolveViewer(slug);
  if ("error" in view) {
    return NextResponse.json(
      { error: view.error },
      { status: view.error === "not-found" ? 404 : 403 },
    );
  }

  const catalog = await loadTownCatalog(slug);
  const labelById = new Map(
    (catalog?.items ?? []).map((it) => [it.id, it.label] as const),
  );

  const rows = await prisma.visitorItem.findMany({
    where: {
      townSlug: slug,
      subjectKey: view.participantKey,
    },
    select: {
      id: true,
      templateId: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const items: ItemWire[] = rows.map((r) => ({
    id: r.id,
    templateId: r.templateId,
    // Falls back to the templateId when the catalog no longer ships a
    // matching template — keeps the row visible in the visitor's
    // inventory instead of dropping it on a designer cleanup.
    templateLabel: labelById.get(r.templateId) ?? r.templateId,
    createdAt: r.createdAt.toISOString(),
  }));

  return NextResponse.json(
    { items },
    { headers: { "cache-control": "no-store" } },
  );
}
