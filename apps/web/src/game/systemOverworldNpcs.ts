// Client-side registry of system-owned overworld NPCs. Mirrors the
// interior founder pattern (hardcoded in interior.ts's INTERIORS.HOME
// spec): sprite + placement live client-side so the renderer can spawn
// them without a DB roundtrip; chat routing points at a bespoke
// /api/<name>-chat endpoint that owns the prompt.
//
// Keep in sync with getSystemNpcs() on the server — the id here must
// match the SystemNpc id there so the chat route finds the persona.

import { PALETTE } from "./config";
import type { OverworldPlacement } from "@town/plot";

export interface SystemOverworldNpc {
  /** Must match the SystemNpc id in apps/web/src/lib/system-npcs.ts. */
  id: string;
  name: string;
  description: string;
  /** kaplay sprite id — pre-loaded at boot (see game/boot.ts). */
  sprite: string;
  /** Where the NPC stands. Resolved at scene mount against the current
   *  plot layout so a moved anchor building keeps its greeter. */
  placement: OverworldPlacement;
  /** Bespoke chat endpoint — bypasses /api/npc-chat since these NPCs
   *  don't live in the Npc DB table. */
  chatApi: string;
  /** Prompt / dialogue accent color. */
  accent: string;
}

// Yellow accent (h60) matches the door-prompt strip so the guide reads
// visually as "orientation help" — same family as [E] Enter prompts.
export const SYSTEM_OVERWORLD_NPCS: SystemOverworldNpc[] = [
  {
    id: "town-guide",
    name: "Guide",
    description:
      "I welcome everyone who comes by — I'll show you around the town and point you at a good first stop.",
    sprite: "office_npc",
    placement: {
      kind: "outside",
      buildingId: "home",
      // Front (south face), offset 2 — one tile below the sign row,
      // right of the door column. This spot is inside the building's
      // clearing (see @town/plot-gen clearingRadiusAt) so decor scatter
      // won't crowd it, and being on the front face is where players
      // naturally arrive from the spawn tile.
      side: "front",
      offset: 2,
    },
    chatApi: "/api/guide-chat",
    accent: PALETTE.h60,
  },
];
