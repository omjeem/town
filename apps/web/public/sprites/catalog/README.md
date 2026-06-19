# Variant catalog

## What this is

This directory hosts the catalog browser at [`index.html`](./index.html). The variant taxonomy lives in [`docs/variant-catalog-draft.md`](../../../../../docs/variant-catalog-draft.md) at the repo root and the actual catalog data is `packages/catalog/src/catalog.json` (imported by `@town/catalog`). Browse the rendered catalog at [`/sprites/catalog/index.html`](./index.html) in dev — one card per variant, with the canonical sign name front-and-center and any sprite art that's already in the catalog dirs. The page fetches `/api/catalog`, so a refresh shows whatever's currently in `catalog.json`.

## How to add a new variant

1. Add an entry to `docs/variant-catalog-draft.md` following the template at the top of the doc (canonical sign name, profession, vibe, palette accent, slot bindings, sprite path).
2. Edit `packages/catalog/src/catalog.json` and add the variant under the correct plot. Each variant needs `id`, `canonical`, `profession`, `vibe`, `paletteAccent`, `exteriorSprite`, and one or more NPC slots — use `npcPositions: [{ id, tx, ty, label }, ...]` for multi-slot variants, or the legacy `npcPosition: { tx, ty, label }` for a single slot. Variants with no resolvable sprite should also set `"needsArt": true`.
3. Refresh `index.html` — the page reads `/api/catalog` at load time, so no rebuild is required.

Committing a variant to the live town (wiring up NPC, slot bindings, etc.) is a separate step in `apps/web/src/town/variants/`. The catalog page only tells you the variant *exists*; the runtime decides when to show it.

## How to mark a variant as adopted into the live town

For now this is informational. Once we wire the first variant into the live town, we'll add an `"adopted": true` field to its entry in `catalog.json` and the catalog page will surface that distinction (probably a third pill alongside `has art` / `needs art`). Until that lands, treat every variant in the catalog as "candidate," not "shipped."
