# @town/catalog

Source of truth for every asset a plot can reference: buildings (exteriors),
interiors (shells + prop layout), and NPC slots per variant.

A **user plot** (defined in `packages/plot/` later) picks one entry from each
list — it never invents new sprite paths. That separation is the whole point
of this package: the catalog is read-only shared infrastructure, the plot is
a small per-user document that references it.

## Schema

See `src/types.ts` for the full TypeScript shape. Top-level:

```ts
Catalog {
  generatedAt: string;
  plots: Plot[];
}

Plot {
  id: string;           // e.g. "home"
  label: string;
  category: Category;   // HOME | WORK | READ | MARKET | MOVE | CREATE | WORKSHOP
  interior: Interior;   // SHARED across every variant of this plot
  variants: Variant[];
}

Interior {
  sprite: string;              // shell under /sprites/catalog/...
  props: InteriorProp[];       // { sprite, tx, ty } anchored top-left
}

Variant {
  id: string;
  canonical: string;
  exteriorSprite: string;                          // path under /sprites/catalog/exteriors/...
  npcPositions: { id?, tx, ty, label }[];          // one slot per NPC the variant supports
  // legacy single-slot form: npcPosition: { tx, ty, label } — still accepted
  // for old single-NPC variants. New variants should use the array.
  // plus optional metadata: profession, vibe, paletteAccent
}
```

The invariant that makes the data clean: **every variant inside a plot shares
the same interior + props**. The only per-variant placement is `npcPosition`
— the NPC stands in a different spot for each variant. That keeps the schema
small and matches the rendering pipeline.

## Adding a new variant

1. Drop the exterior PNG under `apps/web/public/sprites/catalog/exteriors/<category>/`.
2. Edit `src/catalog.json` — add a new entry under the relevant plot's
   `variants[]` with the exterior path + a unique `npcPosition.tx/ty`.
3. Refresh the catalog HTML page at `http://localhost:3000/sprites/catalog/index.html`
   to verify (it fetches the catalog over `/api/catalog`).

## Adding a new plot (whole new category)

1. Drop interior shell + prop PNGs under `apps/web/public/sprites/`.
2. Edit `src/catalog.json` — add a new top-level plot with `interior`
   and at least one `variants[]` entry. Refresh.

## Adding new sprite assets only

Just drop the PNG under the right `/sprites/` subfolder and reference it
from `src/catalog.json`. The audit script (in repo `tmp/sprite_audit.py`)
will warn about anything that isn't referenced.

## Importing

```ts
import { plots, getPlot, getVariant } from "@town/catalog";

const home = getPlot("home");
const cottage = getVariant("home.cottage");
```

## Single source of truth

`src/catalog.json` is the only catalog file in the repo. The TypeScript app
imports it via `@town/catalog`. The static playground at
`apps/web/public/sprites/catalog/index.html` fetches the same data over
`/api/catalog` (served from `apps/web/src/app/api/catalog/route.ts`), so
there's nothing to sync — edit one file, refresh.
