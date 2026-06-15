# @town/plot

The schema for one user's town. A `Plot` is what gets persisted per user
(DB row, file on disk, fixture in tests). Every reference in it must resolve
against `@town/catalog` (buildings, variants) or the extras manifest (decor).

## Shape

```ts
Plot {
  schemaVersion: 1
  id: string
  seed: string
  world: { w, h, tileSize }

  buildings: PlotBuilding[]   // catalog-resolved (Plot, Variant) at a tile coord
  paths:     PlotPath[]       // bezier roads, pre-baked tile lists
  ponds:     PlotPond[]       // small water features, autotiled at render
  decor:     PlotDecor[]      // trees / bushes / flowers / rocks / mushrooms
  npcs:      PlotNpc[]        // one or more per building, with MDX refs later
}
```

See `src/types.ts` for the full contract.

## Validation

```ts
import { validatePlot } from "@town/plot";
const { ok, issues } = validatePlot(plot, manifest);
```

Checks:
- `schemaVersion` is recognized
- `buildings[].plotKey` + `buildings[].variantId` resolve against the catalog
- `paths[].from / .to` reference real building ids in this plot
- `decor[].spriteId` exists in the named manifest group
- `npcs[].buildingId` references a real building

## Default plot

Generated on demand by `@town/plot-gen` and committed to `src/default.json`
(re-exported from `@town/plot` as `defaultPlot`). The webapp imports it for
the no-login fallback so the build is reproducible without re-running the
generator. Rebuild with:

```sh
pnpm plot:build-default
```
