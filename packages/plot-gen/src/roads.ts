// Bezier-curved 2-tile-wide roads from one building's south door to
// another's. Direct port of pgRoadTiles. The 2x2 brush + bezier sampling
// keeps the road visually connected on near-vertical segments.

import { hash32 } from "./rng";
import type { ClearingShape } from "./clearings";
import { inAnyBuilding } from "./clearings";

/** South-edge midpoint of a building. Roads terminate here instead of
 *  being clipped inside the footprint. */
function entryPoint(b: ClearingShape): { x: number; y: number } {
  return { x: b.tx + b.w / 2, y: b.ty + b.h + 0.5 };
}

/** Sample a quadratic bezier from b1's door to b2's door with a seeded
 *  control-point offset. Returns the set of (tx, ty) coordinates the road
 *  occupies, suppressing tiles that fall inside any building. */
export function roadTiles(
  seed: string,
  b1: ClearingShape,
  b2: ClearingShape,
  allBuildings: ClearingShape[],
): Array<[number, number]> {
  const e1 = entryPoint(b1);
  const e2 = entryPoint(b2);
  const midX = (e1.x + e2.x) / 2;
  const midY = (e1.y + e2.y) / 2;
  const h = hash32((seed || "default") + "::road::" + b1.plotKey + "->" + b2.plotKey);
  const offX = ((h & 0xffff) / 65535 - 0.5) * 6;
  const offY = (((h >>> 16) & 0xffff) / 65535 - 0.5) * 6;
  const cx = midX + offX;
  const cy = midY + offY;
  const dist = Math.hypot(e2.x - e1.x, e2.y - e1.y);
  const steps = Math.max(24, Math.ceil(dist * 3));

  const seen = new Set<string>();
  const out: Array<[number, number]> = [];
  function push(x: number, y: number) {
    if (inAnyBuilding(allBuildings, x + 0.5, y + 0.5, 0)) return;
    const key = x + "," + y;
    if (seen.has(key)) return;
    seen.add(key);
    out.push([x, y]);
  }
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    const x = u * u * e1.x + 2 * u * t * cx + t * t * e2.x;
    const y = u * u * e1.y + 2 * u * t * cy + t * t * e2.y;
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    // 2x2 brush keeps the road connected regardless of slope.
    push(ix, iy);
    push(ix + 1, iy);
    push(ix, iy + 1);
    push(ix + 1, iy + 1);
  }
  return out;
}
