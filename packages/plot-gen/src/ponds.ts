// Ponds — 2 to 4 small water features per town. Each pond's count, size,
// and position is hashed off the seed so it's stable per user but varies
// per seed. Trees + decor skip pond tiles and their 1-tile buffer
// downstream.

import { hash32 } from "./rng";
import type { PlotPond } from "@town/plot";
import { inAnyBuilding, type ClearingShape } from "./clearings";
import { WORLD } from "./world";

const POND_DIMS: ReadonlyArray<{ w: number; h: number }> = [
  { w: 3, h: 2 }, { w: 3, h: 2 },  // small puddle (weighted)
  { w: 4, h: 3 }, { w: 4, h: 3 },  // medium pond
  { w: 5, h: 3 }, { w: 5, h: 4 },  // small lake
  { w: 6, h: 4 },                  // long lake
];

export function placePonds(
  seed: string,
  buildings: ClearingShape[],
  pathTiles: Set<string>,
): { ponds: PlotPond[]; pondTiles: Set<string> } {
  const ponds: PlotPond[] = [];
  const pondTiles = new Set<string>();
  const effective = seed || "town";
  const pondCount = 2 + (hash32(effective + "::pond-count") % 3);

  for (let pIdx = 0; pIdx < pondCount; pIdx++) {
    const dimHash = hash32(effective + "::pond-dim::" + pIdx);
    const dim = POND_DIMS[dimHash % POND_DIMS.length]!;
    let placed = false;
    for (let attempt = 0; attempt < 80 && !placed; attempt++) {
      const h = hash32(effective + "::pond-pos::" + pIdx + "::" + attempt);
      const px = 3 + ((h & 0xffff) % (WORLD.W - dim.w - 6));
      const py = 3 + (((h >>> 16) & 0xffff) % (WORLD.H - dim.h - 6));
      let conflict = false;
      for (let dy = -1; dy <= dim.h && !conflict; dy++) {
        for (let dx = -1; dx <= dim.w && !conflict; dx++) {
          const tx = px + dx;
          const ty = py + dy;
          if (inAnyBuilding(buildings, tx + 0.5, ty + 0.5, 1.0)) conflict = true;
          else if (pathTiles.has(tx + "," + ty)) conflict = true;
          else if (pondTiles.has(tx + "," + ty)) conflict = true;
        }
      }
      if (conflict) continue;
      for (let dy = 0; dy < dim.h; dy++) {
        for (let dx = 0; dx < dim.w; dx++) {
          pondTiles.add(px + dx + "," + (py + dy));
        }
      }
      ponds.push({ tx: px, ty: py, w: dim.w, h: dim.h });
      placed = true;
    }
  }
  return { ponds, pondTiles };
}
