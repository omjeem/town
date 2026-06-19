// =============================================================================
// Town catalog — tags + SVG item templates
//
// A town's "catalog" is the per-deployment content that NPCs can hand out
// through their tools: visitor tags (shown above the character's head) and
// SVG item cards (collectible/shareable). Both are content, not engine —
// each town deployment authors its own and uploads via `town deploy`.
//
// Storage:
//   • Tags  → inline in town.json as `tags: TownTagDef[]`.
//   • Items → on disk as items/manifest.json + items/<id>.svg. The CLI
//     walks the directory, validates each SVG's {{placeholder}} set
//     against the manifest's `fields`, bundles into a serialised catalog,
//     and POSTs as part of /api/town.
//
// The server stores the merged catalog (tags + items including SVG body)
// on the Town row. Runtime NPC tools read from there to gate grant_tag /
// give_item and to render the SVG with substituted text.
// =============================================================================

export interface TownTagDef {
  /** Stable id — referenced by NPC permissions and by VisitorTag rows. */
  id: string;
  /** Short human label shown on the head-pill in the overworld. */
  label: string;
  /** Single emoji glyph. */
  emoji: string;
  /** Pill background hex. Renderer picks readable text color. */
  color: string;
  /** null = permanent. Otherwise the tag expires after N seconds. */
  defaultTtlSeconds: number | null;
  /** Shown verbatim to the NPC inside grant_tag's tool description so the
   *  model knows when to grant. Keep to one sentence. */
  description: string;
}

export interface TownItemFieldDef {
  /** Placeholder name — matches `{{name}}` in the SVG body. */
  name: string;
  /** One-line hint the model sees in the give_item tool description. */
  label: string;
  /** Server rejects field values longer than this. */
  maxLength: number;
}

/** Item template as authored on disk. The SVG body lives in a sibling
 *  <id>.svg file and is loaded by the CLI at deploy time. */
export interface TownItemDef {
  id: string;
  label: string;
  /** One-sentence flavor + when to issue. Goes into give_item's tool
   *  description per NPC. */
  description: string;
  fields: TownItemFieldDef[];
}

/** Wire shape after the CLI inlines each SVG body. This is what gets
 *  POSTed and what the server stores on Town.catalogJson. */
export interface TownItemBundle extends TownItemDef {
  /** Raw SVG source with {{field}} placeholders. */
  svg: string;
}

/** Full per-town catalog. Persisted as a single JSON blob on the Town row;
 *  loaded once per chat turn and cached for that request. */
export interface TownCatalog {
  tags: TownTagDef[];
  items: TownItemBundle[];
}
