// Syncs the canonical catalog source to the place the catalog HTML page
// fetches it from at runtime. Run after editing src/catalog.json:
//
//   pnpm --filter @town/catalog sync
//
// The catalog HTML still loads via plain fetch() (no bundler), so we keep
// a copy in apps/web/public/sprites/catalog/variants.json. The TypeScript
// app imports the typed version straight from @town/catalog.

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const src = resolve(here, "..", "src", "catalog.json");
const dst = resolve(
  here,
  "..",
  "..",
  "..",
  "apps",
  "web",
  "public",
  "sprites",
  "catalog",
  "variants.json",
);

const data = readFileSync(src, "utf8");
writeFileSync(dst, data);

const { plots } = JSON.parse(data);
const variantCount = plots.reduce(
  (n: number, p: { variants: unknown[] }) => n + p.variants.length,
  0,
);
console.log(
  `synced catalog → ${dst}  (${plots.length} plots, ${variantCount} variants)`,
);
