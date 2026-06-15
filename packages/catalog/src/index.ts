// @town/catalog — public API.
//
// Everywhere else in the repo (the Next.js app, the CLI, the catalog HTML
// renderer) should import the catalog from here rather than re-reading
// variants.json. This package is the source of truth — adding a new plot,
// variant, interior shell, or prop happens by editing catalog.json + the
// associated PNG, then running `pnpm --filter @town/catalog sync` to push
// the file out to apps/web/public/sprites/catalog/variants.json.

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
