// Plot validation — proves every reference resolves against the catalog
// and the extras manifest. Run at write time (catalog HTML rendering,
// CLI `town deploy`, API write handlers).

import { getPlot as getCatalogPlot, getVariant } from "@town/catalog";
import type { Manifest } from "./manifest";
import type { Plot } from "./types";

export interface ValidationIssue {
  path: string;
  message: string;
}

export interface ValidationResult {
  ok: boolean;
  issues: ValidationIssue[];
}

export function validatePlot(plot: Plot, manifest: Manifest): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (plot.schemaVersion !== 1) {
    issues.push({ path: "schemaVersion", message: `unknown version ${plot.schemaVersion}` });
  }

  // Buildings
  const buildingIds = new Set<string>();
  for (const [i, b] of plot.buildings.entries()) {
    const prefix = `buildings[${i}]`;
    if (buildingIds.has(b.id)) {
      issues.push({ path: `${prefix}.id`, message: `duplicate building id "${b.id}"` });
    }
    buildingIds.add(b.id);

    const catalogPlot = getCatalogPlot(b.plotKey.replace(/-\d+$/, ""));
    if (!catalogPlot) {
      issues.push({ path: `${prefix}.plotKey`, message: `unknown plotKey "${b.plotKey}"` });
      continue;
    }
    const variant = getVariant(b.variantId);
    if (!variant) {
      issues.push({ path: `${prefix}.variantId`, message: `unknown variantId "${b.variantId}"` });
      continue;
    }
    const matches = catalogPlot.variants.some((v) => v.id === b.variantId);
    if (!matches) {
      issues.push({
        path: `${prefix}.variantId`,
        message: `variantId "${b.variantId}" does not belong to plot "${b.plotKey}"`,
      });
    }
    if (b.tx < 0 || b.ty < 0 || b.tx + b.w > plot.world.w || b.ty + b.h > plot.world.h) {
      issues.push({ path: `${prefix}`, message: `building extends past world bounds` });
    }
  }

  // Paths reference real buildings.
  for (const [i, p] of plot.paths.entries()) {
    if (!buildingIds.has(p.from)) {
      issues.push({ path: `paths[${i}].from`, message: `unknown buildingId "${p.from}"` });
    }
    if (!buildingIds.has(p.to)) {
      issues.push({ path: `paths[${i}].to`, message: `unknown buildingId "${p.to}"` });
    }
  }

  // Decor references real manifest entries.
  for (const [i, d] of plot.decor.entries()) {
    const group = (manifest as unknown as Record<string, { id: string }[]>)[d.group];
    if (!group) {
      issues.push({ path: `decor[${i}].group`, message: `unknown manifest group "${d.group}"` });
      continue;
    }
    if (!group.some((e) => e.id === d.spriteId)) {
      issues.push({
        path: `decor[${i}].spriteId`,
        message: `unknown sprite "${d.spriteId}" in group "${d.group}"`,
      });
    }
  }

  // NPCs reference real buildings.
  for (const [i, n] of plot.npcs.entries()) {
    if (!buildingIds.has(n.buildingId)) {
      issues.push({ path: `npcs[${i}].buildingId`, message: `unknown buildingId "${n.buildingId}"` });
    }
  }

  return { ok: issues.length === 0, issues };
}
