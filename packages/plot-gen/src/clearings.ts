// Organic clearings around each building. The clearing geometry is what
// makes the forest scatter feel hand-placed instead of stamped — every
// angle gets a slightly noisy radius derived from (plotKey, angle bucket),
// so a tree planted just outside the edge looks intentional, not gridded.

import { hash32 } from "./rng";

export interface ClearingShape {
  tx: number;
  ty: number;
  w: number;
  h: number;
  spriteW?: number;
  spriteH?: number;
  plotKey: string;
}

/** Radius from the building centre out to the clearing edge at `angle`.
 *  Uses an ellipse derived from the effective extents (max of layout rect
 *  and actual sprite tile dims) so tall sprites carve a tall clearing. */
export function clearingRadiusAt(b: ClearingShape, angle: number): number {
  const effW = Math.max(b.w, b.spriteW ?? b.w);
  const effH = Math.max(b.h, b.spriteH ?? b.h);
  const halfW = effW / 2;
  const halfH = effH / 2;
  const ca = Math.cos(angle);
  const sa = Math.sin(angle);
  const denom = Math.sqrt((ca / halfW) ** 2 + (sa / halfH) ** 2);
  const buildingEdge = denom > 0 ? 1 / denom : Math.max(halfW, halfH);
  const base = buildingEdge + 3.5;
  const bucket = Math.round((angle * 6) / Math.PI);
  const h = hash32(b.plotKey + "::edge::" + bucket);
  const noise = ((h & 0xffff) / 65535 - 0.5) * 3.0;
  return base + noise;
}

/** True if the (tx, ty) tile centre falls inside any building's clearing. */
export function inAnyClearing(
  buildings: ClearingShape[],
  tx: number,
  ty: number,
): boolean {
  for (const b of buildings) {
    const cx = b.tx + b.w / 2;
    const cy = b.ty + b.h / 2;
    const dx = tx - cx;
    const dy = ty - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    if (dist < clearingRadiusAt(b, angle)) return true;
  }
  return false;
}

/** Building footprint test — inflated by `pad` tiles. Used to keep
 *  ponds and decor away from walls. */
export function inAnyBuilding(
  buildings: ClearingShape[],
  tx: number,
  ty: number,
  pad = 0,
): boolean {
  for (const b of buildings) {
    if (
      tx >= b.tx - pad &&
      tx < b.tx + b.w + pad &&
      ty >= b.ty - pad &&
      ty < b.ty + b.h + pad
    ) {
      return true;
    }
  }
  return false;
}
