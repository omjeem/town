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

/** A sprite reference inside a CustomPlot. Either:
 *   • a catalog path — e.g. "exteriors/home/villa-1.png" (lives under
 *     /sprites/catalog/) or a manifest entry id — verified against the
 *     bundled catalog/manifest at validate time.
 *   • an uploaded sprite ref — "sprite:<contentHash>" — served from
 *     /api/sprites/<hash>.png. The CLI rewrites local "./foo.png" refs
 *     into "sprite:<hash>" form during deploy after uploading bytes.
 *
 *  The server never sees raw local paths — by the time a CustomPlot is
 *  persisted, every reference resolves through `resolveSpriteUrl`. */
export type SpriteRef = string;

/** One prop placed inside a CustomPlot's interior. Mirrors
 *  `@town/catalog`'s `InteriorProp` shape but with `SpriteRef` semantics. */
export interface CustomInteriorProp extends TilePos {
  sprite: SpriteRef;
}

/** Interior shell + props for a CustomPlot. All variants of one
 *  CustomPlot share this interior — the "one room, many doors" pattern.
 *
 *  Dimensions + walkability are explicit so the renderer doesn't have to
 *  guess. Tile coords are 0-indexed top-left; pixels = tiles × 16. */
export interface CustomInterior {
  sprite: SpriteRef;
  props: CustomInteriorProp[];
  /** Room size in tile units. Sprite must be (widthTiles*16) × (heightTiles*16). */
  widthTiles: number;
  heightTiles: number;
  /** Main walkable rect — the floor the player can roam. */
  walkable: TileRect;
  /** Extra walkable tiles outside the main rect (porches, doormats). */
  extraWalkable?: TileRect[];
  /** Furniture / wall rects inside `walkable` the player cannot cross. */
  blocked?: TileRect[];
  /** Tile the player appears on when entering. */
  spawn: TilePos;
  /** Tile the player walks onto to return to the overworld. */
  exit: TilePos;
}

/** One slot inside a CustomPlot variant. */
export interface CustomNpcPosition extends TilePos {
  /** Stable slot id. Optional for single-slot variants — the empty
   *  string is the implicit default that the CLI binds to when an MDX
   *  doesn't set `slotId`. */
  id?: string;
  label: string;
}

/** One exterior variant of a CustomPlot. */
export interface CustomVariant {
  id: string;
  exteriorSprite: SpriteRef;
  /** Actual sprite tile dimensions (16 px each). Set when the sprite is
   *  larger than the building's footprint so the world placement can
   *  reserve room above for it — without these, two tall sprites placed
   *  on non-overlapping footprints stack visually. Defaults to (w, h)
   *  when omitted. */
  spriteW?: number;
  spriteH?: number;
  /** Legacy single-position slot. Optional — variants that ship
   *  `npcPositions` can omit it. At least one of the two must exist. */
  npcPosition?: CustomNpcPosition;
  /** Every NPC slot the variant supports. When absent, readers treat
   *  the variant as having a single slot `[npcPosition]`. */
  npcPositions?: CustomNpcPosition[];
}

/** A user-defined plot. Mirrors `@town/catalog`'s `Plot` shape so the
 *  effective catalog (catalog ∪ plot.customPlots) is uniform from the
 *  generator's point of view. Buildings reference these via
 *  `plotKey: "custom:<id>"`. */
export interface CustomPlot {
  /** Local id; the building's plotKey is "custom:<id>". */
  id: string;
  label: string;
  category: Category;
  interior: CustomInterior;
  variants: CustomVariant[];
}

/** One building on the town map. `plotKey` + `variantId` together resolve
 *  to a `(Plot, Variant)` pair in the catalog. */
export interface PlotBuilding extends TileRect {
  /** Stable id within the plot (e.g. "home" or "office-2"). Persisted so
   *  paths / NPCs can reference a specific instance even if multiple
   *  instances of the same plotKey exist. */
  id: string;
  /** Text shown on the overworld sign in front of the building. When
   *  absent the renderer falls back to `id.toUpperCase()` — so a fresh
   *  `{ id: "cake", plotKey: "store" }` shows "CAKE" out of the box. Set
   *  explicitly when you want casing or spacing the id can't carry
   *  (e.g. "Sunny's Café"). */
  label?: string;
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
  /** When true, the interior of this building hosts a multi-party group
   *  chat (humans + NPCs in the building) reachable with the [G]
   *  keystroke. Per-building opt-in — defaults to false on every other
   *  building so the feature stays scoped to the houses the owner has
   *  actually turned it on for. Single source of truth, no env flag. */
  groupChatEnabled?: boolean;
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
  /** Slot id within the variant's `npcPositions`. Empty string means
   *  "the default first slot" — what one-slot variants resolve to and
   *  what a CLI MDX without a `slotId` frontmatter binds to. */
  slotId: string;
  label: string;
  /** Pointer to an MDX file (relative to the plot dir) that holds the
   *  default prompt, role, and ability declarations. Phase 3. */
  mdxRef?: string;
}

/** Which side of a building an overworld NPC stands on. `front` is the
 *  south face (where the door is); `back` is north; `left`/`right` are
 *  the west/east faces respectively. Offset counts tiles OUTWARD from
 *  the building's outer edge on that side. */
export type OverworldAnchorSide = "front" | "back" | "left" | "right";

/** Authored placement for an overworld NPC. Round-tripped through the
 *  DB so the server can re-resolve tile coords whenever the anchor
 *  building moves. Renderers never read this — they read the resolved
 *  `tx`/`ty` on `PlotOverworldNpc`. */
export type OverworldPlacement =
  | {
      /** Absolute world-tile coords. */
      kind: "position";
      tx: number;
      ty: number;
    }
  | {
      /** Anchored to a building's edge. Server resolves to (tx, ty) at
       *  materialization time. */
      kind: "outside";
      buildingId: string;
      side: OverworldAnchorSide;
      /** Tiles outward from the building's edge (default 1). */
      offset?: number;
    };

/** An NPC placed loose in the overworld — either at explicit world
 *  coords or anchored to a building's exterior. Sibling of `PlotNpc`;
 *  the latter is strictly interior. */
export interface PlotOverworldNpc extends TilePos {
  /** DB Npc.id — the renderer looks up the chat row by this. */
  npcId: string;
  /** Display name for the sign / prompt / greeting. Denormalized off
   *  the Npc row so the client can render without a second fetch. */
  label: string;
  /** The authored placement, preserved so re-materialization is
   *  deterministic when buildings move. */
  placement: OverworldPlacement;
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
  /** NPCs placed loose in the overworld (not inside a building). Absent
   *  is treated as an empty list — every existing plot.json stays valid. */
  overworldNpcs?: PlotOverworldNpc[];
  /** User-defined plots. A `PlotBuilding.plotKey` of `"custom:<id>"`
   *  resolves to one of these instead of an entry in `@town/catalog`. */
  customPlots?: CustomPlot[];
}

/** Prefix used by every `PlotBuilding.plotKey` that resolves to a
 *  `CustomPlot` instead of a catalog `Plot`. */
export const CUSTOM_PLOT_PREFIX = "custom:";

/** True for plotKeys that resolve to a CustomPlot. */
export function isCustomPlotKey(plotKey: string): boolean {
  return plotKey.startsWith(CUSTOM_PLOT_PREFIX);
}

/** Strip the "custom:" prefix; returns null if it isn't a custom key. */
export function customPlotId(plotKey: string): string | null {
  return plotKey.startsWith(CUSTOM_PLOT_PREFIX)
    ? plotKey.slice(CUSTOM_PLOT_PREFIX.length)
    : null;
}
