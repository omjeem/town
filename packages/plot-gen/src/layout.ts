// Town layout — picks the cell and jittered tile coordinate for every
// active plot. Direct port of pgGenerateLayout from the catalog playground.
//
// Invariants:
//   1. Same (seed, plotKey) always produces the same position.
//   2. Different users (different seeds) get different positions for
//      everything except the day-0 trio (home / library / store), which
//      sit in fixed cells so every town reads as a settlement from
//      slot 1.
//   3. Adding a new plot type at the end of PLOT_PRIORITY does NOT move
//      any plot already placed (each plot draws its hash independently).

import { hash32 } from "./rng";
import { WORLD, PLOT_PRIORITY } from "./world";

export interface CellPos {
  col: number;
  row: number;
}

export interface BuildingRect {
  tx: number;
  ty: number;
  w: number;
  h: number;
  cell: CellPos;
}

function cellToRect(cell: CellPos, jitterKey: string): BuildingRect {
  const baseTx = cell.col * WORLD.CELL_W + (WORLD.CELL_W - WORLD.PLOT_W) / 2;
  const baseTy = cell.row * WORLD.CELL_H + (WORLD.CELL_H - WORLD.PLOT_H) / 2;
  // Per-cell jitter so buildings don't all line up on the grid (±1.5 tiles).
  const h = hash32(jitterKey + "::jit::" + cell.col + "," + cell.row);
  const jx = ((h & 0xffff) / 65535 - 0.5) * 3;
  const jy = (((h >>> 16) & 0xffff) / 65535 - 0.5) * 3;
  return {
    tx: Math.round(Math.max(4, Math.min(WORLD.W - WORLD.PLOT_W - 4, baseTx + jx))),
    ty: Math.round(Math.max(4, Math.min(WORLD.H - WORLD.PLOT_H - 4, baseTy + jy))),
    w: WORLD.PLOT_W,
    h: WORLD.PLOT_H,
    cell,
  };
}

function allCells(): CellPos[] {
  const out: CellPos[] = [];
  for (let r = 0; r < WORLD.ROWS; r++) {
    for (let c = 0; c < WORLD.COLS; c++) out.push({ col: c, row: r });
  }
  return out;
}

/** Assign each active plot a (cell, rect). Returns a map keyed by
 *  plotKey (with instance suffix, e.g. "office-2"). */
export function generateLayout(
  seed: string,
  activeCount: number,
): Record<string, BuildingRect> {
  const effectiveSeed = seed.length > 0 ? seed : "town";
  const active = PLOT_PRIORITY.slice(0, activeCount);
  const out: Record<string, BuildingRect> = {};

  // Day-0 core trio — fixed cells regardless of seed.
  const homeCol = Math.floor((WORLD.COLS - 1) / 2);
  const homeRow = Math.floor((WORLD.ROWS - 1) / 2);
  const coreCells: Record<string, CellPos> = {
    home:    { col: homeCol,     row: homeRow },
    library: { col: homeCol - 1, row: homeRow },
    store:   { col: homeCol + 1, row: homeRow },
  };

  const cells = allCells();
  const usedKeys = new Set<string>();
  for (const key of Object.keys(coreCells)) {
    if (!active.includes(key)) continue;
    const cell = coreCells[key]!;
    out[key] = cellToRect(cell, effectiveSeed + "::" + key);
    usedKeys.add(cell.col + "," + cell.row);
  }

  // Behavioural unlocks — each plot picks its cell independently.
  for (const plotKey of active) {
    if (plotKey in coreCells) continue;
    const remaining = cells.filter((c) => !usedKeys.has(c.col + "," + c.row));
    if (remaining.length === 0) break;
    let picked: CellPos | null = null;
    for (let salt = 0; salt < 8; salt++) {
      const h = hash32(
        effectiveSeed + "::plot::" + plotKey +
        (salt ? "::salt::" + salt : ""),
      );
      const candidate = remaining[h % remaining.length]!;
      if (!usedKeys.has(candidate.col + "," + candidate.row)) {
        picked = candidate;
        break;
      }
    }
    if (!picked) picked = remaining[0]!;
    out[plotKey] = cellToRect(picked, effectiveSeed + "::" + plotKey);
    usedKeys.add(picked.col + "," + picked.row);
  }

  return out;
}
