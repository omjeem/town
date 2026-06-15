// Generates the guest plot.json — 6 buildings at seed="core" — and writes
// it to packages/plot/src/default.json. The webapp imports this via
// `@town/plot`'s `defaultPlot` export to serve the no-login fallback view.
//
// Run from the repo root:
//   pnpm --filter @town/plot-gen build-default
//
// Commit the output so the build is reproducible without re-running the
// generator on every CI run.

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { catalog } from "@town/catalog";
import { validatePlot, type Manifest } from "@town/plot";
import { generatePlot } from "../src";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..", "..", "..");

const manifestPath = resolve(
  repoRoot,
  "apps/web/public/sprites/extras/MANIFEST.json",
);
const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Manifest;

const plot = generatePlot({
  seed: "core",
  catalog,
  manifest,
  // Day-zero trio + the first three behavioural unlocks (office / cafe /
  // workshop). cafe is skipped at render time because it isn't in the
  // catalog yet, so the visible building count is 5. Forest stays dense
  // because canopies are now allowed to overlap (see decor.ts).
  activeCount: 6,
  id: "core-default-plot",
});

const { ok, issues } = validatePlot(plot, manifest);
if (!ok) {
  console.error("Plot failed validation:");
  for (const issue of issues) console.error(`  ${issue.path}: ${issue.message}`);
  process.exit(1);
}

const sourceDst = resolve(here, "..", "..", "plot", "src", "default.json");
const json = JSON.stringify(plot, null, 2) + "\n";
writeFileSync(sourceDst, json);

console.log(
  `built default plot — ${plot.buildings.length} buildings, ` +
  `${plot.paths.length} paths, ${plot.ponds.length} ponds, ` +
  `${plot.decor.length} decor, ${plot.npcs.length} npcs`,
);
console.log(`  → ${sourceDst}`);
