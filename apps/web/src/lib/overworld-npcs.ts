// Resolve authored overworld-NPC placements against the current plot
// layout. Called from `/api/town` POST after applyTownShape so the NPC
// tiles line up with wherever the layout engine dropped each building.
//
// Two placement kinds:
//   • { kind: "position", tx, ty }        — absolute world tile
//   • { kind: "outside", buildingId,
//       side, offset? }                   — anchored to a building's edge
//
// The resolver returns a fresh Plot with `overworldNpcs` set, plus an
// issues list for anything that couldn't land (out of bounds, colliding
// with a building/pond, or anchored to a missing building). The caller
// (POST handler) surfaces the issues as a 400 so authors can fix the
// MDX before the deploy commits.

import {
  resolveOverworldPlacementTile,
  type OverworldPlacement,
  type Plot,
  type PlotOverworldNpc,
} from "@town/plot";

export interface ResolvableOverworldNpc {
  npcId: string;
  name: string;
  placement: OverworldPlacement;
}

export interface OverworldResolutionIssue {
  path: string;
  message: string;
}

export interface OverworldResolutionResult {
  plot: Plot;
  issues: OverworldResolutionIssue[];
}

/** Build the collision set — tiles no overworld NPC may occupy.
 *  Buildings and ponds block; roads / decor stay walkable (the player
 *  can too). Path tiles ARE walkable, so an NPC standing on a road is
 *  legal — visually a little odd but not a failure. */
function buildCollisionSet(plot: Plot): Set<string> {
  const blocked = new Set<string>();
  for (const b of plot.buildings) {
    for (let dy = 0; dy < b.h; dy++) {
      for (let dx = 0; dx < b.w; dx++) {
        blocked.add(`${b.tx + dx},${b.ty + dy}`);
      }
    }
  }
  for (const p of plot.ponds) {
    for (let dy = 0; dy < p.h; dy++) {
      for (let dx = 0; dx < p.w; dx++) {
        blocked.add(`${p.tx + dx},${p.ty + dy}`);
      }
    }
  }
  return blocked;
}

/** Materialize plot.overworldNpcs from the DB roster + resolved layout.
 *  Returns the mutated plot alongside any placement failures so the
 *  caller can surface them without the deploy committing a half-broken
 *  world. */
export function resolveOverworldNpcs(
  plot: Plot,
  npcs: ResolvableOverworldNpc[],
): OverworldResolutionResult {
  const issues: OverworldResolutionIssue[] = [];
  const buildingsById = new Map(plot.buildings.map((b) => [b.id, b]));
  const blocked = buildCollisionSet(plot);
  const claimed = new Map<string, string>();
  const resolved: PlotOverworldNpc[] = [];

  for (const [i, entry] of npcs.entries()) {
    const path = `overworldNpcs[${i}] "${entry.name}"`;
    const coords = resolveOverworldPlacementTile(
      entry.placement,
      buildingsById,
    );
    if (!coords) {
      issues.push({
        path,
        message:
          entry.placement.kind === "outside"
            ? `anchored to building "${entry.placement.buildingId}" but that building isn't in the current layout.`
            : `couldn't resolve placement (${JSON.stringify(entry.placement)})`,
      });
      continue;
    }
    const { tx, ty } = coords;
    if (
      tx < 0 ||
      ty < 0 ||
      tx >= plot.world.w ||
      ty >= plot.world.h
    ) {
      issues.push({
        path,
        message: `resolves to tile (${tx}, ${ty}) which is outside the world (${plot.world.w}×${plot.world.h}). ${
          entry.placement.kind === "outside"
            ? "Try a smaller offset or a different side."
            : "Move the position closer to the town center."
        }`,
      });
      continue;
    }
    const key = `${tx},${ty}`;
    if (blocked.has(key)) {
      issues.push({
        path,
        message: `resolves to tile (${tx}, ${ty}), which is inside a building or pond. ${
          entry.placement.kind === "outside"
            ? "Increase `offset` or pick a different side."
            : "Pick a different tile — the town moved under you."
        }`,
      });
      continue;
    }
    const prior = claimed.get(key);
    if (prior !== undefined) {
      issues.push({
        path,
        message: `resolves to tile (${tx}, ${ty}), already taken by "${prior}". Give one of them a different placement.`,
      });
      continue;
    }
    claimed.set(key, entry.name);
    resolved.push({
      npcId: entry.npcId,
      label: entry.name,
      placement: entry.placement,
      tx,
      ty,
    });
  }

  return {
    plot: { ...plot, overworldNpcs: resolved },
    issues,
  };
}
