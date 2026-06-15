// Pure decision logic — given an inbound TownEvent and the user's current
// plot + NPCs, return the list of mutations to apply. No I/O, no Prisma,
// no Redis — easy to unit test.
//
// Today's rules are intentionally minimal so behaviour is predictable:
//
//   memory.created
//     For each topic CORE classified the memory under, if the topic maps
//     to a `plotKey` and that plot is not already in the user's plot,
//     emit `add-building`. Topic→plotKey mapping is intentionally narrow
//     — CORE topics that don't map cleanly are ignored.
//
//   identity.created
//     If the user has a HOME NPC and it still carries the seed name
//     "Hudson" (or no description), emit `tweak-npc` to absorb the new
//     identity fact into the description so the world runner feels like
//     it's getting to know the player. If the user has no HOME NPC yet
//     (edge case — pre-seedNpcs row), skip and let ensureNpcsForUser
//     handle it on the next chat hit.

import type { Plot } from "@town/plot";
import type { TownEvent } from "@town/types";

export interface NpcRowLite {
  id: string;
  buildingId: string;
  name: string;
  description: string;
  prompt: string;
}

export interface DecideContext {
  plot: Plot;
  npcs: NpcRowLite[];
}

export type Effect =
  | { kind: "add-building"; plotKey: string; reason: string }
  | {
      kind: "tweak-npc";
      npcId: string;
      fields: Partial<Pick<NpcRowLite, "name" | "description" | "prompt">>;
      reason: string;
    };

/** CORE topic → town plotKey. Lowercase match. Add entries as the catalog
 *  grows; unknown topics are skipped (no panic). */
const TOPIC_TO_PLOT: Record<string, string> = {
  music: "studio",
  audio: "studio",
  studio: "studio",
  fitness: "gym",
  workout: "gym",
  health: "gym",
  food: "cafe",
  cafe: "cafe",
  coffee: "cafe",
  cooking: "cafe",
  work: "office",
  meetings: "office",
  engineering: "workshop",
  building: "workshop",
  craft: "workshop",
  performance: "stage",
  stage: "stage",
  practice: "practice",
  rehearsal: "practice",
  travel: "station",
  commute: "station",
};

function hasBuilding(plot: Plot, plotKey: string): boolean {
  // Match base plotKey ignoring the -N instance suffix, so "office" hits
  // both "office" and "office-2" in the plot.
  const base = plotKey.replace(/-\d+$/, "");
  return plot.buildings.some(
    (b) => b.plotKey.replace(/-\d+$/, "") === base,
  );
}

export function decide(event: TownEvent, ctx: DecideContext): Effect[] {
  const effects: Effect[] = [];

  switch (event.type) {
    case "memory.created": {
      const seen = new Set<string>();
      for (const topic of event.payload.topics) {
        const plotKey = TOPIC_TO_PLOT[topic.toLowerCase()];
        if (!plotKey) continue;
        if (seen.has(plotKey)) continue;
        seen.add(plotKey);
        if (hasBuilding(ctx.plot, plotKey)) continue;
        effects.push({
          kind: "add-building",
          plotKey,
          reason: `memory topic "${topic}" mapped to ${plotKey}`,
        });
      }
      return effects;
    }

    case "identity.created": {
      const homeNpc = ctx.npcs.find((n) => n.buildingId === "home");
      if (!homeNpc) return effects;
      // Only absorb the fact when the NPC still looks freshly-seeded.
      // Once the user (or the CLI) has edited the description, leave it.
      const isFreshSeed =
        homeNpc.description.startsWith("Butler of the world") ||
        homeNpc.description.trim() === "";
      if (!isFreshSeed) return effects;
      effects.push({
        kind: "tweak-npc",
        npcId: homeNpc.id,
        fields: {
          description:
            `Butler of the world. Remembers: ${event.payload.fact}`,
        },
        reason: `absorb identity fact "${event.payload.fact}"`,
      });
      return effects;
    }
  }
}
