// /api/town — high-level read/write of the caller's town.
//
//   GET  /api/town                  → { buildings, customPlots, npcs, version }
//   POST /api/town { buildings, customPlots?, npcs? }
//                                   → { version, count }
//
// The CLI's `town clone` / `town deploy` go through here. /api/plot
// stays around as the raw-plot escape hatch for power users and the
// in-game renderer.
//
// On POST the server owns layout: it diffs the incoming buildings list
// against the persisted Plot and runs incremental add/remove/changeVariant
// ops. CustomPlots are merged onto the plot wholesale. NPCs replace the
// existing roster atomically.

import { NextResponse } from "next/server";
import { z } from "zod";

import { resolveUser } from "@/lib/auth-bearer";
import { prisma } from "@/lib/db";
import { loadManifest } from "@/lib/manifest";
import { normalizePermissions } from "@/lib/npc-templates";
import {
  applyTownShape,
  getTownShape,
  type TownShape,
} from "@/lib/town-shape";
import { IncrementalError } from "@town/plot-gen";
import type { CustomPlot, Plot } from "@town/plot";
import { validatePlot } from "@town/plot";

const NpcSchema = z.object({
  buildingId: z.string().min(1),
  // Slot within the building. Empty string is the implicit first slot
  // (the legacy one-NPC-per-building case). The CLI defaults to "" when
  // an MDX frontmatter doesn't set it.
  slotId: z.string().default(""),
  name: z.string().min(1),
  description: z.string(),
  prompt: z.string(),
  id: z.string().optional(),
  // Tool capability grant — integrations, core tasks/memory, skills.
  // We don't shape this in zod because the normaliser in npc-templates
  // already silently drops unknown keys (preventing permission leaks
  // from typos), and duplicating the shape here would just create a
  // second place to update.
  permissions: z.unknown().optional(),
});

const BuildingSchema = z.object({
  id: z.string().min(1),
  plotKey: z.string().min(1),
  // Optional — the server falls back to the plot's first variant when
  // the caller doesn't pin one. Lets `town init` ship a default
  // town.json without knowing catalog variant ids ahead of time.
  variantId: z.string().min(1).optional(),
  // Optional sign text. Empty string clears any existing label.
  label: z.string().optional(),
  // Per-house group-chat opt-in. Absent = "no change" (preserve current
  // value); explicit true/false = patch. Mirrors PlotBuilding's flag.
  groupChatEnabled: z.boolean().optional(),
});

const CustomNpcPositionSchema = z.object({
  id: z.string().optional(),
  tx: z.number(),
  ty: z.number(),
  label: z.string(),
});

const CustomVariantSchema = z
  .object({
    id: z.string().min(1),
    exteriorSpriteCandidates: z.array(z.string()).min(1),
    // Legacy single-position field — optional. New customPlots can
    // ship `npcPositions` alone; older CLI builds still send this.
    npcPosition: CustomNpcPositionSchema.optional(),
    npcPositions: z.array(CustomNpcPositionSchema).optional(),
  })
  .refine(
    (v) => Boolean(v.npcPosition) || (v.npcPositions && v.npcPositions.length > 0),
    {
      message: "variant must declare `npcPosition` or `npcPositions`",
      path: ["npcPosition"],
    },
  );

const CustomInteriorPropSchema = z.object({
  tx: z.number(),
  ty: z.number(),
  sprite: z.string(),
});

const CustomPlotSchema = z.object({
  id: z.string().min(1),
  label: z.string(),
  category: z.string(),
  interior: z.object({
    spriteCandidates: z.array(z.string()).min(1),
    props: z.array(CustomInteriorPropSchema),
  }),
  variants: z.array(CustomVariantSchema).min(1),
});

const PostBodySchema = z.object({
  buildings: z.array(BuildingSchema).min(1),
  customPlots: z.array(CustomPlotSchema).optional(),
  npcs: z.array(NpcSchema).optional(),
});

export async function GET(req: Request) {
  const resolved = await resolveUser(req);
  if (!resolved) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { shape, version, npcs } = await getTownShape(resolved.user.id);
  return NextResponse.json({
    buildings: shape.buildings,
    customPlots: shape.customPlots,
    npcs,
    version,
  });
}

export async function POST(req: Request) {
  const resolved = await resolveUser(req);
  if (!resolved) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  let parsed;
  try {
    parsed = PostBodySchema.parse(await req.json());
  } catch (e) {
    return NextResponse.json(
      { error: "bad-request", detail: e instanceof Error ? e.message : "invalid body" },
      { status: 400 },
    );
  }

  const userId = resolved.user.id;
  const input: TownShape = {
    buildings: parsed.buildings,
    customPlots: (parsed.customPlots ?? []) as CustomPlot[],
  };

  let applied;
  try {
    applied = await applyTownShape(userId, input);
  } catch (e) {
    if (e instanceof IncrementalError) {
      return NextResponse.json(
        { error: "incremental-failed", code: e.code, detail: e.message },
        { status: 400 },
      );
    }
    throw e;
  }

  const check = validatePlot(applied.plot as Plot, loadManifest());
  if (!check.ok) {
    return NextResponse.json(
      { error: "validation-failed", issues: check.issues },
      { status: 400 },
    );
  }

  let npcCount = 0;
  if (parsed.npcs && parsed.npcs.length >= 0) {
    npcCount = await prisma.$transaction(async (tx) => {
      await tx.npc.deleteMany({ where: { userId } });
      if (parsed.npcs!.length === 0) return 0;
      const created = await tx.npc.createMany({
        data: parsed.npcs!.map((n) => ({
          ...(n.id ? { id: n.id } : {}),
          userId,
          buildingId: n.buildingId,
          slotId: n.slotId,
          name: n.name,
          description: n.description,
          prompt: n.prompt,
          // Always run incoming permissions through the normaliser
          // (drops unknown keys, coerces types). Absent in the body
          // → leave the field off so the nullable JSONB column lands
          // as null, which the chat runtime treats as "no tools"
          // rather than carrying over a stale grant.
          // Prisma's JSONB inputs want a generic InputJsonObject; the
          // strict NpcPermissions interface doesn't carry the required
          // index signature, so we cast through `object` the same way
          // PlotRow handles its `json` blob.
          ...(n.permissions !== undefined
            ? {
                permissions: normalizePermissions(
                  n.permissions,
                ) as unknown as object,
              }
            : {}),
        })),
      });
      return created.count;
    });
  }

  return NextResponse.json({
    version: applied.version,
    count: npcCount,
  });
}
