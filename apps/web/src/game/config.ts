// Game-wide constants for core-town.
//
// Tile coordinates are integers; world pixel coords are tile * TILE.
// LimeZu's Modern Exteriors pack is authored at 16x16, so we match that.

import type { Color, KAPLAYCtx } from "kaplay";

export const TILE = 16;

// Virtual (logical) game resolution. The canvas stretches+letterboxes to
// fit the viewport; pixel art stays crisp. Larger virtual size = camera
// shows more world at once (zoom out). 960x540 ÷ 16 = 60x33.75 tiles visible.
export const VIEW_W = 960;
export const VIEW_H = 540;

// World dimensions, in tiles. Width matches the 60-tile view (960÷16) so
// the playfield fills the screen instead of leaving a letterbox strip on
// the right. Buildings cluster on the left half; the right half is pond
// + forest park.
export const WORLD_W = 60;
export const WORLD_H = 36;

// How long a single-tile move tween takes, in seconds.
export const MOVE_TIME = 0.12;

// ---------------------------------------------------------------------------
// Palette — pulled from CORE's tailwind.css so the game UI matches the
// product. Names are kept as h<deg> (hue) only because so much of the code
// already references them; actual hex values now come from CORE's primary,
// status, and custom-avatar tokens.
// ---------------------------------------------------------------------------

export const PALETTE = {
  h60:  "#e67333", // CORE orange-500       (HOME accent)
  h90:  "#dcb016", // CORE yellow-500       (MAILBOX accent)
  h120: "#7b8a34", // CORE custom-2 olive
  h150: "#54935b", // CORE custom-6 green   (GRASS base)
  h180: "#2b9684", // CORE custom-10 teal
  h210: "#4187c0", // CORE custom-7 blue
  h240: "#0381e9", // CORE primary blue     (OFFICE accent)
  h270: "#886dbc", // CORE custom-4 purple  (LIBRARY accent)
  h300: "#a165a1", // CORE custom-8 magenta
  h330: "#b0617c", // CORE custom-12 rose   (STORE accent)
  h360: "#d75056", // CORE red-500
} as const;

export const INK = "#1a1d22";   // outlines, eyes, deep shadow
export const CREAM = "#f5edd4"; // sign boards, HUD text

// ---------------------------------------------------------------------------
// UI surface palette — used by the neobrutalism HUD/panel/prompt primitives
// so the in-game UI matches getcore.me's white-card + thick-black-border look.
// ---------------------------------------------------------------------------
export const PAPER  = "#f6f3ea";  // warm off-white card surface
export const WALL   = "#c5d0dc";  // pale blue-grey (matches body bg / website)
export const SHADOW = "#0e1116";  // hard-offset drop shadow (no blur)

// Neobrutalism style constants — chunky, no rounding, hard shadows.
export const NB_BORDER = 2;       // px border thickness on UI surfaces
export const NB_SHADOW_OFFSET = 3;// px offset for the drop shadow

// Convenience: hex string -> kaplay Color.
export function hex(k: KAPLAYCtx, h: string): Color {
  return k.Color.fromHex(h);
}

export type Facing = "up" | "down" | "left" | "right";
