// Server-side postcard renderer.
//
// Mirrors the kaplay overworld draw order (ground → ponds → paths →
// decor → buildings) on a node canvas, then frames the camera around
// the buildings' bounding box (NOT fit-width on the whole world — see
// computeFrame for why) and stamps the town-sign overlay. Output is a
// PNG buffer ready to be streamed back from a Route Handler.
//
// Why duplicate the draw logic instead of driving a headless browser:
// the deploy target can't reasonably pull in chromium, and we don't
// want a 1–3 s cold start per share. The duplication is bounded — the
// autotile + grass colour + town-sign overlay all share modules with
// the in-game scene + capture path:
//
//   GRASS_HEX + autotile9Slice  ←  apps/web/src/lib/plot-render.ts
//   drawTownSign / drawCoreBadge ←  apps/web/src/lib/postcard-sign.ts
//   loadManifest                ←  apps/web/src/lib/manifest.ts
//
// What this file owns is the order of layers, the camera projection,
// and the sprite-path conventions — currently:
//
//   ✓ ground (solid green)
//   ✓ ponds (autotiled, 9-slice)
//   ✓ paths (autotiled, 9-slice)
//   ✓ decor (sprite-at-tile)
//   ✓ buildings (bottom-center anchored)
//   ✗ building plaques (the small in-front-of-the-door signs) — skipped
//   ✗ player + remote players — postcard is static, no characters

import {
  createCanvas,
  loadImage,
  type Image,
} from "@napi-rs/canvas";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { GRASS_HEX, autotile9Slice } from "./plot-render";
import {
  drawCoreBadge,
  drawPopulationBadge,
  drawTownSign,
} from "./postcard-sign";
import { findSpriteByHash } from "./sprite";
import type { Manifest, Plot, PlotBuilding } from "@town/plot";
import { isUploadedSpriteRef, uploadedSpriteHash } from "@town/plot";

// Output sizing — 1200×628 hits Twitter's `summary_large_image` spec
// (1200×628, 1.91:1) and OpenGraph's recommended size (1200×630). One
// image works for X, LinkedIn, WhatsApp, Facebook previews without
// per-platform resizing.
const VIEW_W = 1200;
const VIEW_H = 628;
const VIEW_ASPECT = VIEW_W / VIEW_H;

// Tiles of forest border to leave around the buildings' bounding box.
// Big enough that the camera doesn't crop into a tree canopy at the
// edge, small enough that the buildings stay the focal point. A
// 12×15 terraced-house sprite is roughly this tall, so the border
// reads as a frame, not the whole image.
const FRAME_PAD_TILES = 8;

/** Sprite-aware extents of a single building in world tile coords. The
 *  sprite is bottom-center anchored on the south edge of the footprint,
 *  so it can extend left/right of the footprint (wider sprite) and
 *  upward (taller sprite). */
function buildingExtents(b: PlotBuilding): {
  left: number;
  top: number;
  right: number;
  bottom: number;
} {
  const sw = b.spriteW ?? b.w;
  const sh = b.spriteH ?? b.h;
  const left = b.tx + (b.w - sw) / 2;
  const top = b.ty + b.h - sh;
  return { left, top, right: left + sw, bottom: top + sh };
}

/** Frame the postcard around the buildings instead of the whole world.
 *  Returns a source rect (in world pixels) with the same aspect as the
 *  output view. Falls back to the full world when the plot has no
 *  buildings (defensive — every persisted plot has at least HOME). */
function computeFrame(plot: Plot): {
  srcX: number;
  srcY: number;
  srcW: number;
  srcH: number;
} {
  const tileSize = plot.world.tileSize;
  const worldW = plot.world.w;
  const worldH = plot.world.h;

  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const b of plot.buildings) {
    const e = buildingExtents(b);
    if (e.left < x0) x0 = e.left;
    if (e.top < y0) y0 = e.top;
    if (e.right > x1) x1 = e.right;
    if (e.bottom > y1) y1 = e.bottom;
  }
  if (x0 === Infinity) {
    x0 = 0;
    y0 = 0;
    x1 = worldW;
    y1 = worldH;
  }

  // Pad with a forest border so the buildings sit inside a frame
  // instead of flush to the canvas edge.
  x0 -= FRAME_PAD_TILES;
  y0 -= FRAME_PAD_TILES;
  x1 += FRAME_PAD_TILES;
  y1 += FRAME_PAD_TILES;

  // Extend the under-sized axis so the box matches VIEW_ASPECT exactly.
  // (drawImage scales src→dst independently per axis, so any mismatch
  // would horizontally or vertically stretch the world.)
  const boxW = x1 - x0;
  const boxH = y1 - y0;
  if (boxW / boxH < VIEW_ASPECT) {
    const need = boxH * VIEW_ASPECT;
    const extra = (need - boxW) / 2;
    x0 -= extra;
    x1 += extra;
  } else {
    const need = boxW / VIEW_ASPECT;
    const extra = (need - boxH) / 2;
    y0 -= extra;
    y1 += extra;
  }

  // World cap: if the aspect-corrected box is bigger than the world
  // along one axis, snap it to the full world along that axis and
  // re-derive the other axis from VIEW_ASPECT so we stay distortion-free.
  if (x1 - x0 > worldW) {
    x0 = 0;
    x1 = worldW;
    const targetH = worldW / VIEW_ASPECT;
    const cy = (y0 + y1) / 2;
    y0 = cy - targetH / 2;
    y1 = cy + targetH / 2;
  }
  if (y1 - y0 > worldH) {
    y0 = 0;
    y1 = worldH;
    const targetW = worldH * VIEW_ASPECT;
    const cx = (x0 + x1) / 2;
    x0 = cx - targetW / 2;
    x1 = cx + targetW / 2;
  }

  // Shift (don't shrink) the box back into world bounds. Shrinking
  // would break the aspect lock.
  if (x0 < 0) {
    x1 -= x0;
    x0 = 0;
  }
  if (y0 < 0) {
    y1 -= y0;
    y0 = 0;
  }
  if (x1 > worldW) {
    x0 -= x1 - worldW;
    x1 = worldW;
  }
  if (y1 > worldH) {
    y0 -= y1 - worldH;
    y1 = worldH;
  }
  if (x0 < 0) x0 = 0;
  if (y0 < 0) y0 = 0;

  return {
    srcX: x0 * tileSize,
    srcY: y0 * tileSize,
    srcW: (x1 - x0) * tileSize,
    srcH: (y1 - y0) * tileSize,
  };
}

// Public sprites directory. Resolved off process.cwd() so it works
// whether Next runs from apps/web or the monorepo root.
let cachedSpritesDir: string | null = null;
function publicSpritesDir(): string {
  if (cachedSpritesDir) return cachedSpritesDir;
  const candidates = [
    path.resolve(process.cwd(), "apps", "web", "public", "sprites"),
    path.resolve(process.cwd(), "public", "sprites"),
  ];
  for (const c of candidates) {
    if (existsSync(c)) {
      cachedSpritesDir = c;
      return c;
    }
  }
  // Default — let the readFile call surface a useful error later.
  cachedSpritesDir = candidates[0]!;
  return cachedSpritesDir;
}

// Sprite cache shared across requests so we don't re-decode the same
// PNG on every export.
const spriteCache = new Map<string, Image>();

async function loadSprite(rel: string): Promise<Image> {
  const cached = spriteCache.get(rel);
  if (cached) return cached;
  const buf = await readFile(path.join(publicSpritesDir(), rel));
  const img = await loadImage(buf);
  spriteCache.set(rel, img);
  return img;
}

/** Resolve a building's exteriorSprite to a decoded image, regardless of
 *  whether the ref points at a shipped catalog PNG ("exteriors/foo.png")
 *  or a user-uploaded blob ("sprite:<hash>" — bytes live in the Sprite
 *  table). The in-game scene goes through resolveSpriteUrl for this
 *  switch; the postcard renders server-side, so we read the bytes
 *  directly instead of looping back through HTTP. */
async function loadBuildingSprite(ref: string): Promise<Image> {
  if (isUploadedSpriteRef(ref)) {
    const hash = uploadedSpriteHash(ref)!;
    const cacheKey = "upload:" + hash;
    const cached = spriteCache.get(cacheKey);
    if (cached) return cached;
    const row = await findSpriteByHash(hash);
    if (!row) {
      throw new Error(`uploaded sprite ${hash} not found in Sprite table`);
    }
    const img = await loadImage(row.bytes);
    spriteCache.set(cacheKey, img);
    return img;
  }
  return loadSprite("catalog/" + ref);
}

export async function renderTownPostcard(opts: {
  plot: Plot;
  manifest: Manifest;
  townName: string;
  ownerName: string;
  /** Static-snapshot population the postcard advertises. Mirrors the
   *  in-game HUD's Population badge — owner + authored NPCs (visitors
   *  aren't part of the persisted town). Callers count `Npc` rows for
   *  the town owner and pass `npcCount + 1` here. */
  population: number;
}): Promise<Buffer> {
  const { plot, manifest, townName, ownerName, population } = opts;

  const tileSize = plot.world.tileSize;
  const worldPxW = plot.world.w * tileSize;
  const worldPxH = plot.world.h * tileSize;

  // 1. Paint the full world into an offscreen canvas at native pixel
  //    density. We'll scale it into the 16:9 view canvas after.
  const world = createCanvas(worldPxW, worldPxH);
  const wctx = world.getContext("2d");
  wctx.imageSmoothingEnabled = false;

  // Ground — solid green to match the scene's `drawGround`.
  wctx.fillStyle = GRASS_HEX;
  wctx.fillRect(0, 0, worldPxW, worldPxH);

  // Ponds — autotile from the 9-slice pond_* sprites.
  const pondSet = new Set<string>();
  for (const p of plot.ponds) {
    for (let dy = 0; dy < p.h; dy++) {
      for (let dx = 0; dx < p.w; dx++) {
        pondSet.add(p.tx + dx + "," + (p.ty + dy));
      }
    }
  }
  for (const key of pondSet) {
    const [xs, ys] = key.split(",");
    const x = parseInt(xs!, 10);
    const y = parseInt(ys!, 10);
    const name = autotile9Slice(pondSet, x, y, "pond");
    try {
      const img = await loadSprite(`${name}.png`);
      wctx.drawImage(img, x * tileSize, y * tileSize);
    } catch {
      // sprite missing — leave the cell green
    }
  }

  // Paths — same 9-slice autotile flow.
  const pathSet = new Set<string>();
  for (const p of plot.paths) {
    for (const [x, y] of p.tiles) pathSet.add(x + "," + y);
  }
  for (const key of pathSet) {
    const [xs, ys] = key.split(",");
    const x = parseInt(xs!, 10);
    const y = parseInt(ys!, 10);
    const name = autotile9Slice(pathSet, x, y, "path");
    try {
      const img = await loadSprite(`${name}.png`);
      wctx.drawImage(img, x * tileSize, y * tileSize);
    } catch {
      // missing path edge — skip
    }
  }

  // Decor — scatter sprites resolved through the extras manifest.
  // The scene draws trees at a higher z than bushes/flowers; on a
  // single 2D canvas all we need is to paint trees last so they sit on
  // top of the smaller decor and the building footprints.
  const decorOrdered = [...plot.decor].sort((a, b) => {
    const at = a.group === "trees" ? 1 : 0;
    const bt = b.group === "trees" ? 1 : 0;
    return at - bt;
  });
  const manifestByGroup = manifest as unknown as Record<
    string,
    { id: string; file: string }[]
  >;
  for (const d of decorOrdered) {
    const groupEntries = manifestByGroup[d.group];
    if (!groupEntries) continue;
    const entry = groupEntries.find((e) => e.id === d.spriteId);
    if (!entry) continue;
    try {
      const img = await loadSprite("extras/" + entry.file);
      wctx.drawImage(img, d.tx * tileSize, d.ty * tileSize);
    } catch {
      // missing decor sprite — skip
    }
  }

  // Buildings — bottom-center anchored on the south edge of the
  // footprint, same anchor the scene uses. Refs can be either a catalog
  // path or an uploaded `sprite:<hash>` blob — loadBuildingSprite
  // dispatches between the two so customPlots show up in the postcard,
  // not just the in-game scene.
  for (const b of plot.buildings) {
    try {
      const img = await loadBuildingSprite(b.exteriorSprite);
      const xPx = Math.round((b.tx + b.w / 2) * tileSize - img.width / 2);
      const yPx = Math.round((b.ty + b.h) * tileSize - img.height);
      wctx.drawImage(img, xPx, yPx);
    } catch (err) {
      console.warn(
        "[postcard.png] skipped building sprite",
        b.id,
        b.exteriorSprite,
        err,
      );
    }
  }

  // 2. Frame around the buildings (not the whole world). With only a
  //    handful of buildings on a 90×80 world, fit-width would crop the
  //    top/bottom rows AND leave the village reading as a tiny dot in
  //    the wilderness. computeFrame returns an aspect-matched source
  //    rect centered on the buildings + a forest border.
  const { srcX, srcY, srcW, srcH } = computeFrame(plot);

  const view = createCanvas(VIEW_W, VIEW_H);
  const vctx = view.getContext("2d");
  vctx.imageSmoothingEnabled = false;
  vctx.fillStyle = "#c5d0dc";
  vctx.fillRect(0, 0, VIEW_W, VIEW_H);
  vctx.drawImage(world, srcX, srcY, srcW, srcH, 0, 0, VIEW_W, VIEW_H);

  // 3. Stamp the town sign, CORE attribution badge, and population
  //    counter. CORE badge sits top-left, population top-right mirroring
  //    the in-game HUD, town sign bottom-right.
  drawTownSign(vctx, VIEW_W, VIEW_H, townName, ownerName);
  drawCoreBadge(vctx, VIEW_H);
  drawPopulationBadge(vctx, VIEW_W, VIEW_H, population);

  return view.toBuffer("image/png");
}
