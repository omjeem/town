// @town/plot — schema for one user's town.
//
// A Plot is what a single user owns. It is produced by `@town/plot-gen` from
// (catalog + manifest + seed), validated by `validate.ts`, and consumed by
// the webapp renderer. Plot.json is the durable artifact — DB row, file
// shipped by the CLI, fixture in tests.
//
// Contract: every sprite/variant/decoration referenced from here must exist
// in `@town/catalog` (for buildings) or the extras manifest (for decor).
// `validate()` proves that contract holds.

import type { Category } from "@town/catalog";

export interface TilePos {
  tx: number;
  ty: number;
}

export interface TileRect extends TilePos {
  w: number;
  h: number;
}

/** One building on the town map. `plotKey` + `variantId` together resolve
 *  to a `(Plot, Variant)` pair in the catalog. */
export interface PlotBuilding extends TileRect {
  /** Stable id within the plot (e.g. "home" or "office-2"). Persisted so
   *  paths / NPCs can reference a specific instance even if multiple
   *  instances of the same plotKey exist. */
  id: string;
  plotKey: string;        // → @town/catalog plot id
  variantId: string;      // → @town/catalog variant id (must belong to plotKey)
  category: Category;
  /** Actual exterior sprite tile dimensions — used by clearing geometry
   *  so tall sprites get tall clearings. Falls back to (w, h). */
  spriteW?: number;
  spriteH?: number;
  /** Resolved sprite path (relative to /sprites/). Filled in by the
   *  generator so the renderer doesn't have to re-resolve. */
  exteriorSprite: string;
}

/** A 2-wide bezier road from one building to another. Tiles is the
 *  pre-baked set of (tx, ty) the road occupies. */
export interface PlotPath {
  from: string;           // PlotBuilding.id
  to: string;             // PlotBuilding.id
  tiles: Array<[number, number]>;
}

/** A small water feature — rect placement, autotiled at render time. */
export interface PlotPond extends TileRect {}

/** One piece of scatter decor — tree, bush, flower, etc. */
export interface PlotDecor extends TilePos {
  /** Top-level group in the manifest: "trees" | "bushes" | "flowers" | ... */
  group: string;
  /** Sprite id within that group (e.g. "tree-05", "flower-02"). */
  spriteId: string;
}

/** An NPC slot bound to a building. Position is INSIDE the interior, not
 *  on the overworld. */
export interface PlotNpc extends TilePos {
  buildingId: string;     // PlotBuilding.id
  label: string;
  /** Pointer to an MDX file (relative to the plot dir) that holds the
   *  default prompt, role, and ability declarations. Phase 3. */
  mdxRef?: string;
}

export interface PlotWorld {
  w: number;
  h: number;
  tileSize: number;
}

export interface Plot {
  schemaVersion: 1;
  id: string;
  seed: string;
  world: PlotWorld;
  buildings: PlotBuilding[];
  paths: PlotPath[];
  ponds: PlotPond[];
  decor: PlotDecor[];
  npcs: PlotNpc[];
}
