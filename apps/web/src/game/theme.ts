// Theme tokens: one place to control how the town LOOKS without re-cutting
// art. Sign accent colors per building, day/night overlay, and (later) CORE
// personality tints all read from here. Change values, retheme everything.

import { PALETTE } from "./config";

export type BuildingKey = "HOME" | "OFFICE" | "LIBRARY" | "STORE";

export type BuildingTheme = {
  // Accent painted onto the code-drawn sign in front of the building.
  accent: string;
  // Optional sprite tint multiply (1.0 = original art, lower = mood shift).
  tintR?: number;
  tintG?: number;
  tintB?: number;
};

export type Theme = {
  buildings: Record<BuildingKey, BuildingTheme>;
  // Single shared backdrop used behind every interior sprite. One uniform
  // dark fill — no per-building tinting, no vignettes — so the room sprite
  // is the only colored thing on screen.
  interiorBackdrop: string;
  mailboxAccent: string;
  signCream: string;
  // Day/night overlay color + opacity. Opacity 0 = high noon.
  overlay: { color: string; opacity: number };
};

export const theme: Theme = {
  buildings: {
    // CORE primary blue — used as the default theme accent across the
    // sign-in CTA, the HOME sign, and the home NPC dialogue.
    HOME:    { accent: PALETTE.h240 },
    OFFICE:  { accent: PALETTE.h240 },
    LIBRARY: { accent: PALETTE.h270 },
    STORE:   { accent: PALETTE.h330 },
  },
  interiorBackdrop: "#0e1116", // SHADOW — same near-black for every room
  mailboxAccent: PALETTE.h90,
  signCream: "#f5edd4",
  overlay: { color: "#1a1d22", opacity: 0 },
};
