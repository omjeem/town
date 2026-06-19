// GET /api/towns/[slug]/tags
//
// Returns the currently-active visitor tags for everyone who's earned at
// least one in this town, plus the catalog metadata needed to render
// each tag pill (label, emoji, color). The overworld's React layer
// polls this and stacks the matching pills above each remote player's
// head card.
//
// Auth: none. Tags are public game state — they're literally displayed
// above the character to anyone walking by — so gating this endpoint
// would just mean every visitor needs a session before they could see
// the indicators they already see in-world.
//
// Caching: no-store. Tags can change every chat turn, and the response
// is small (a few hundred bytes per active subject).

import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { loadTownCatalog } from "@/lib/town-tools";

type Params = { slug: string };

interface TagWire {
  id: string;
  label: string;
  emoji: string;
  color: string;
  /** ISO timestamp; null = permanent. */
  expiresAt: string | null;
}

export async function GET(_req: Request, ctx: { params: Promise<Params> }) {
  const { slug } = await ctx.params;
  // Catalog tells us how to render each tag id (label/emoji/color). If
  // the town has no catalog, no NPC could have granted a tag in the
  // first place — return an empty map without hitting the rows table.
  const catalog = await loadTownCatalog(slug);
  if (!catalog) {
    return NextResponse.json(
      { tagsBySubject: {} },
      { headers: { "cache-control": "no-store" } },
    );
  }
  const defsById = new Map(catalog.tags.map((t) => [t.id, t]));

  // Look up the owner so we can filter them out. grant_tag refuses to
  // register for owners now, but historical rows (or DB-edited rows)
  // could still match; the head-pill is supposed to be a visitor-only
  // signal in any case.
  const town = await prisma.town.findUnique({
    where: { slug },
    select: { ownerId: true },
  });
  const ownerSubjectKey = town ? `user:${town.ownerId}` : null;

  const now = new Date();
  const rows = await prisma.visitorTag.findMany({
    where: {
      townSlug: slug,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      ...(ownerSubjectKey ? { NOT: { subjectKey: ownerSubjectKey } } : {}),
    },
    select: {
      subjectKey: true,
      tagId: true,
      expiresAt: true,
    },
  });

  const tagsBySubject: Record<string, TagWire[]> = {};
  for (const row of rows) {
    const def = defsById.get(row.tagId);
    // Catalog drift: a row references a tag the catalog no longer
    // declares. Drop silently — the row will still be cleaned up by
    // any future delete pass; the renderer just can't show it.
    if (!def) continue;
    const list = tagsBySubject[row.subjectKey] ?? [];
    list.push({
      id: def.id,
      label: def.label,
      emoji: def.emoji,
      color: def.color,
      expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
    });
    tagsBySubject[row.subjectKey] = list;
  }

  return NextResponse.json(
    { tagsBySubject },
    { headers: { "cache-control": "no-store" } },
  );
}
