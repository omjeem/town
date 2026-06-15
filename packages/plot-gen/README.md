# @town/plot-gen

Deterministic town generator. Given `(seed, catalog, manifest, activeCount)`
returns a fully-formed `Plot` from `@town/plot`. Same input always produces
identical output — that's the contract every consumer relies on.

This is a pure TypeScript port of the `pg*` functions that used to live
inline in `apps/web/public/sprites/catalog/index.html`. The catalog playground
will eventually import from here instead of carrying its own copy.

## Usage

```ts
import { catalog } from "@town/catalog";
import { generatePlot } from "@town/plot-gen";

const plot = generatePlot({
  seed: "harshith",
  catalog,
  manifest,                  // load from /sprites/extras/MANIFEST.json
  activeCount: 3,            // 3 = day-0 trio (home, library, store)
  variantOverrides: {        // optional: pin specific variants
    home: "home.cottage",
  },
});
```

## Internals

- `rng.ts` — `hash32` and seeded `shuffle`
- `world.ts` — world dimensions, `PLOT_PRIORITY`, `baseKey()`
- `layout.ts` — `generateLayout(seed, activeCount)` — cells → tile rects
- `clearings.ts` — organic clearing geometry around each building
- `roads.ts` — bezier road tiles from one building's door to another
- `ponds.ts` — 2-4 small water features placed around the buildings
- `decor.ts` — distance-falloff forest scatter + sparse decor
- `generate.ts` — stitches everything into a `Plot`

## Building the default plot

```sh
pnpm plot:build-default
```

Writes `packages/plot/src/default.json`. `@town/plot` re-exports this as
`defaultPlot` for TypeScript callers (the webapp imports it for the
no-login fallback). The catalog HTML playground generates plots on the
fly in the browser, so it doesn't need the on-disk file.

Commit it. The build is reproducible (same seed = same output), so we
don't run the generator on every CI invocation.
