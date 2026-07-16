// Overworld placement math — the single source of truth for turning a
// `{ side, offset }` anchor (or a raw `{ tx, ty }`) into a world tile.
// Server uses this at deploy time to materialize plot.overworldNpcs;
// the client uses it to place system NPCs (the town guide) that don't
// live in the plot.
//
// A geometry change here — e.g. shifting the "front" placement to the
// left of the door instead of the right — needs to happen exactly once
// to keep both sides in sync. Duplicating it elsewhere is a bug.

import type { OverworldPlacement, PlotBuilding, TilePos } from "./types";

/** Compute the world tile for one placement. Returns null when
 *  `placement.kind === "outside"` and the anchor building doesn't exist
 *  — the caller decides whether that's a hard error (deploy validation)
 *  or a soft skip (client-side system NPC standing near a building the
 *  town happens not to have). */
export function resolveOverworldPlacementTile(
  placement: OverworldPlacement,
  buildingsById: Map<string, PlotBuilding>,
): TilePos | null {
  if (placement.kind === "position") {
    return { tx: placement.tx, ty: placement.ty };
  }
  const b = buildingsById.get(placement.buildingId);
  if (!b) return null;
  const offset = placement.offset ?? 1;
  const doorCol = b.tx + Math.floor(b.w / 2);
  switch (placement.side) {
    case "front": {
      // South face. Shift one column right of the door so the door
      // itself stays walkable — an NPC on the door tile would strand
      // the player on interior exit.
      return { tx: doorCol + 1, ty: b.ty + b.h - 1 + offset };
    }
    case "back": {
      // North face. No door here, so center on the building's door
      // column is safe.
      return { tx: doorCol, ty: b.ty - offset };
    }
    case "left":
      return { tx: b.tx - offset, ty: b.ty + Math.floor(b.h / 2) };
    case "right":
      return {
        tx: b.tx + b.w - 1 + offset,
        ty: b.ty + Math.floor(b.h / 2),
      };
  }
}
