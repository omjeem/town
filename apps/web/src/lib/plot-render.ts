// Render-time helpers shared between the in-game kaplay scene and the
// server-side postcard renderer. Anything that's stateless plot logic
// (autotiling, base colours, etc.) lives here so the two render paths
// stay in lockstep.

/** Solid green base under every plot. The scene fills the whole world
 *  rectangle with this colour; the server renderer does the same so
 *  the exported postcard reads as the same ground. */
export const GRASS_HEX = "#6b9a4b";

/** 9-slice autotile lookup. `set` is the set of "tx,ty" keys belonging
 *  to the feature; the returned suffix maps to the matching edge/corner
 *  sprite ("path_tl", "pond_c", …). */
export function autotile9Slice(
  set: Set<string>,
  x: number,
  y: number,
  prefix: string,
): string {
  const has = (xx: number, yy: number) => set.has(xx + "," + yy);
  const nG = !has(x, y - 1);
  const sG = !has(x, y + 1);
  const wG = !has(x - 1, y);
  const eG = !has(x + 1, y);
  if (nG && wG) return prefix + "_tl";
  if (nG && eG) return prefix + "_tr";
  if (sG && wG) return prefix + "_bl";
  if (sG && eG) return prefix + "_br";
  if (nG) return prefix + "_t";
  if (sG) return prefix + "_b";
  if (wG) return prefix + "_l";
  if (eG) return prefix + "_r";
  return prefix + "_c";
}
