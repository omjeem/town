// @town/catalog — public API.
//
// Single source of truth: `./catalog.json`. The Next.js app imports it
// through this module; the static catalog browser at
// /sprites/catalog/index.html fetches the same data over /api/catalog.
// To add a plot, variant, interior shell, or prop: edit catalog.json
// and drop the PNG under apps/web/public/sprites/. No sync step.

import raw from "./catalog.json";
import type { Catalog, Plot, Variant, Category } from "./types";

export * from "./types";

/** The fully-typed catalog. */
export const catalog: Catalog = raw as Catalog;

/** All plots, in canonical order. */
export const plots: Plot[] = catalog.plots;

/** Look up one plot by id (e.g. "home"). */
export function getPlot(id: string): Plot | undefined {
  return plots.find((p) => p.id === id);
}

/** Look up one variant by its fully-qualified id (e.g. "home.cottage"). */
export function getVariant(id: string): Variant | undefined {
  for (const p of plots) {
    const v = p.variants.find((x) => x.id === id);
    if (v) return v;
  }
  return undefined;
}

/** All plots in a category. */
export function plotsByCategory(cat: Category): Plot[] {
  return plots.filter((p) => p.category === cat);
}
