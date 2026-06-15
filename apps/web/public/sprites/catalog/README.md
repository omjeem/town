# Variant catalog

## What this is

This directory is the source of truth for *what variants the town can offer* — keyed by canonical sign name, not raw sprite filenames. The variant taxonomy lives in [`docs/variant-catalog-draft.md`](../../../../../docs/variant-catalog-draft.md) at the repo root and is mirrored into [`variants.json`](./variants.json) for the preview UI. Browse the rendered catalog at [`/sprites/catalog/index.html`](./index.html) in dev — one card per variant, with the canonical sign name front-and-center and any sprite art that's already in the catalog dirs.

## How to add a new variant

1. Add an entry to `docs/variant-catalog-draft.md` following the template at the top of the doc (canonical sign name, profession, vibe, palette accent, anchor objects, slot bindings, trigger signals, sprite candidate paths).
2. Re-run the generator (or manually update `variants.json`) so the new entry appears under the correct plot. Each variant needs `id`, `canonical`, `profession`, `vibe`, `paletteAccent`, `exteriorSpriteCandidates`, `interiorSpriteCandidates`, `anchorObjects`, and `triggers`. Variants with no resolvable sprite candidates should also set `"needsArt": true`.
3. Refresh `index.html` — the page reads `variants.json` at load time, so no rebuild is required.

Committing a variant to the live town (wiring up triggers, NPC, slot bindings, etc.) is a separate step in `apps/web/src/town/variants/`. The catalog page only tells you the variant *exists*; the runtime decides when to show it.

## How to mark a variant as adopted into the live town

For now this is informational. Once we wire the first variant into the live town, we'll add an `"adopted": true` field to its entry in `variants.json` and the catalog page will surface that distinction (probably a third pill alongside `has art` / `needs art`). Until that lands, treat every variant in the catalog as "candidate," not "shipped."
