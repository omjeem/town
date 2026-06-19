// Public share rendering for VisitorItem rows. Each item is a row +
// template+catalog lookup → SVG substitution → optional PNG raster. The
// /items/[id] viewer page and the /api/items/[id]/{svg,png} endpoints
// all funnel through `loadVisitorShare` so the lookup logic lives once.

import { Image, createCanvas } from "@napi-rs/canvas";

import { prisma } from "./db";
import { findItem, loadTownCatalog, renderItemSvg } from "./town-tools";

export interface LoadedVisitorShare {
  itemId: string;
  templateId: string;
  templateLabel: string;
  svg: string;
}

/** Find the VisitorItem, resolve the town's catalog, render the SVG with
 *  the persisted field values. Returns null when the item or its
 *  template no longer exists (template was removed from the catalog).
 *
 *  Re-rendering on read (instead of persisting the rendered SVG) means a
 *  designer's SVG fix propagates to past cards automatically — but it
 *  also means a removed template orphans its old cards. That's the right
 *  trade for v1: catalog edits stay simple. */
export async function loadVisitorShare(
  itemId: string,
): Promise<LoadedVisitorShare | null> {
  const row = await prisma.visitorItem.findUnique({
    where: { id: itemId },
    select: { id: true, townSlug: true, templateId: true, fields: true },
  });
  if (!row) return null;

  const catalog = await loadTownCatalog(row.townSlug);
  if (!catalog) return null;

  const template = findItem(catalog, row.templateId);
  if (!template) return null;

  // The grant_tag/give_item tools validated fields at write time; we
  // re-validate on read because the template's maxLength may have
  // shrunk since. renderItemSvg silently clips overlong values to the
  // current max — keeps old cards renderable instead of erroring.
  const values =
    row.fields && typeof row.fields === "object" && !Array.isArray(row.fields)
      ? (row.fields as Record<string, string>)
      : {};
  const { svg } = renderItemSvg(template, values);
  return {
    itemId: row.id,
    templateId: template.id,
    templateLabel: template.label,
    svg,
  };
}

/** Rasterise an SVG string into a PNG buffer. Twitter / LinkedIn / etc.
 *  don't fetch SVG og:image values, so the /api/items/[id]/png route
 *  exists purely so link previews unfurl with the card. */
export async function renderSvgToPng(svg: string): Promise<Buffer> {
  const img = new Image();
  img.src = Buffer.from(svg, "utf8");
  // @napi-rs/canvas's Image picks up width/height from the SVG's viewBox
  // (1200x630 for every Core Town card). createCanvas at the same size
  // and drawImage onto the origin.
  const width = img.width || 1200;
  const height = img.height || 630;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.encode("png");
}
