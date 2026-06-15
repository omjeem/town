// Persist the Effect[] from decide() to Postgres in a single transaction
// per user. Bumps PlotRow.version on any plot mutation so the kaplay
// scene's poller picks up the change on its next tick.
//
// add-building: walk the catalog's PLOT_PRIORITY in order, find the first
// plotKey that matches the requested base (e.g. "studio" → "studio" or
// "studio-2" if "studio" is already taken) that isn't already in the
// user's plot, then regenerate the plot via the seed-based generator with
// activeCount = current count + 1. We don't surgically inject — letting
// the generator place the new building keeps clearings + roads + decor
// consistent with the rest of the town. The new building's NPC is seeded
// from the same role-template map seedNpcs uses.

import { catalog } from "@town/catalog";
import { generatePlot, PLOT_PRIORITY, baseKey } from "@town/plot-gen";
import type { Manifest, Plot } from "@town/plot";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { prisma } from "@/lib/db";
import { seedNpcs } from "@/lib/plot";
import type { Effect } from "./decide";

let cachedManifest: Manifest | null = null;
function getManifest(): Manifest {
  if (cachedManifest) return cachedManifest;
  const path = resolve(
    process.cwd(),
    "public",
    "sprites",
    "extras",
    "MANIFEST.json",
  );
  cachedManifest = JSON.parse(readFileSync(path, "utf8")) as Manifest;
  return cachedManifest;
}

export interface ApplyResult {
  buildingsAdded: number;
  npcsTweaked: number;
}

/** Apply effects for one user. Returns counts so the worker can log a
 *  one-line summary per event. */
export async function applyEffects(
  userId: string,
  effects: Effect[],
): Promise<ApplyResult> {
  let buildingsAdded = 0;
  let npcsTweaked = 0;
  if (effects.length === 0) return { buildingsAdded, npcsTweaked };

  // Read current plot once outside the transaction (read-only).
  const row = await prisma.plotRow.findUnique({ where: { userId } });
  if (!row) return { buildingsAdded, npcsTweaked };
  let plot = row.json as unknown as Plot;
  let plotMutated = false;

  for (const effect of effects) {
    if (effect.kind === "add-building") {
      const resolvedKey = pickInstanceKey(effect.plotKey, plot);
      if (!resolvedKey) continue;
      const newCount = plot.buildings.length + 1;
      plot = generatePlot({
        seed: plot.seed,
        catalog,
        manifest: getManifest(),
        activeCount: nextActiveCount(plot, resolvedKey, newCount),
        id: plot.id,
      });
      buildingsAdded += 1;
      plotMutated = true;
      continue;
    }
    if (effect.kind === "tweak-npc") {
      await prisma.npc.update({
        where: { id: effect.npcId },
        data: effect.fields,
      });
      npcsTweaked += 1;
      continue;
    }
  }

  if (plotMutated) {
    await prisma.$transaction(async (tx) => {
      await tx.plotRow.update({
        where: { userId },
        data: {
          json: plot as unknown as object,
          version: { increment: 1 },
        },
      });
    });
    // Seed NPCs for any new buildings we just added (seedNpcs is
    // idempotent via skipDuplicates + per-row uniqueness checks).
    await seedNpcs(userId, plot);
  }

  return { buildingsAdded, npcsTweaked };
}

/** Find the first instance-suffix variant of `plotKey` (e.g. "studio",
 *  "studio-2", "studio-3", …) that exists in PLOT_PRIORITY and isn't
 *  already in the user's plot. Returns null if the catalog has no room
 *  left for another instance. */
function pickInstanceKey(plotKey: string, plot: Plot): string | null {
  const targetBase = baseKey(plotKey);
  const existing = new Set(plot.buildings.map((b) => b.plotKey));
  for (const key of PLOT_PRIORITY) {
    if (baseKey(key) !== targetBase) continue;
    if (existing.has(key)) continue;
    return key;
  }
  return null;
}

/** Compute the activeCount value to pass to generatePlot so the new
 *  building's slot in PLOT_PRIORITY is included. */
function nextActiveCount(plot: Plot, newKey: string, target: number): number {
  const idx = PLOT_PRIORITY.indexOf(newKey);
  if (idx < 0) return target;
  // activeCount = idx + 1 ensures the new key (and everything before it)
  // is in scope; if the plot was already taller (e.g. the user previously
  // unlocked something deeper in the priority list), keep that count.
  return Math.max(target, idx + 1, plot.buildings.length + 1);
}
