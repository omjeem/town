// World constants — match the catalog playground exactly so the layout
// stays visually identical between the playground UI and the live game.
// Changing any of these shifts every existing user's town.

export const WORLD = {
  W: 90,         // tiles
  H: 80,
  TILE: 16,      // px per tile (only used by the renderer)
  CELL_W: 15,
  CELL_H: 16,
  COLS: 6,
  ROWS: 5,
  PLOT_W: 10,
  PLOT_H: 7,
} as const;

/** 30-slot priority list. Slice the first N to control how many plots
 *  are active in a given town. */
export const PLOT_PRIORITY: readonly string[] = [
  // Day-0 trio (fixed positions)
  "home", "library", "store",
  // Tier 1 unlocks
  "office", "cafe", "workshop", "studio",
  "stage", "practice", "station", "gym",
  // Tier 2 growth (repeat instances)
  "workshop-2", "office-2", "studio-2", "library-2",
  "cafe-2", "home-2", "practice-2", "station-2",
  "workshop-3",
  // Tier 3 mature
  "studio-3", "office-3", "cafe-3", "home-3",
  "library-3", "workshop-4", "studio-4", "office-4",
  "cafe-4", "gym-2",
];

/** Strip the trailing instance suffix (e.g. "office-2" → "office") so a
 *  per-instance plot key resolves to its canonical catalog entry. */
export function baseKey(plotKey: string): string {
  return plotKey.replace(/-\d+$/, "");
}
