# town-next

A personal town generated from your [CORE](https://app.getcore.me) profile and
rendered as a small top-down [kaplay](https://kaplayjs.com) game in the browser.

Each user gets a deterministic plot: buildings, roads, ponds, and decor are
laid out from a seed; each building maps to a variant from a shared catalog
(`office.hacker-cabin`, `home.cottage`, …); LLM curation names them based on
what CORE knows about you (GitHub, Linear, calendar, …).

## Stack

- **pnpm + Turbo** monorepo (`pnpm@10`, Node 20+)
- **Next.js 16** (App Router) — server routes, OAuth callback, webhooks
- **kaplay 3001** — game runtime
- **Prisma + Postgres** — sessions, plot state, event log
- **BullMQ + Redis** — event worker for inbound CORE webhooks
- **AI SDK** (Anthropic / OpenAI) — plot naming + NPC dialog

## Workspace layout

```
apps/
  web/                  Next.js app — game, UI, API routes, worker
packages/
  catalog/              Shared asset catalog (plots, variants, sprite paths)
  plot/                 Per-user plot schema + validator + default plot
  plot-gen/             Deterministic plot generator (seed → Plot)
  db/                   Prisma schema + client (@town/db)
  types/                Shared TS types (Plot, Variant, TownState, EventEnvelope)
  town-cli/             Local CLI for poking at plots / catalog
docs/                   Design notes (variant taxonomy, etc.)
```

Each package has its own README — start there when working in one.

## Getting started

```bash
cp .env.example .env
# Fill DATABASE_URL and the CORE_OAUTH_* vars.
# CORE_OAUTH_CLIENT_ID/SECRET come from POST /api/oauth/clients on
# app.getcore.me — see comments in .env.example for the payload.

pnpm install
pnpm db:migrate --name init
pnpm dev
```

Then open <http://localhost:3001>. `.env` lives at the repo root;
`apps/web/.env` is a symlink so Next picks it up, and `@town/db` scripts
load it via `dotenv-cli`.

## Common commands

Run from the repo root:

| Command | What it does |
| --- | --- |
| `pnpm dev` | `turbo run dev` — starts the web app |
| `pnpm build` | Production build of every package |
| `pnpm typecheck` | `tsc --noEmit` across the monorepo |
| `pnpm lint` | Lint every package |
| `pnpm db:migrate` | `prisma migrate dev` in `@town/db` |
| `pnpm db:generate` | Regenerate the Prisma client |
| `pnpm db:studio` | Open Prisma Studio |
| `pnpm catalog:sync` | Rebuild `public/sprites/catalog/variants.json` from `@town/catalog` |
| `pnpm plot:build-default` | Regenerate the committed default plot |

The event worker (BullMQ consumer for CORE webhooks) runs separately:

```bash
pnpm --filter @town/web run worker
```

## Auth & CORE integration

CORE OAuth2 + PKCE. The browser only ever sees an opaque session cookie
(`core-town:sid`); access and refresh tokens live in the `Session` table.

- Client entry points: `apps/web/src/game/auth.ts`
- Server endpoints: `apps/web/src/app/api/auth/{login,callback,me,logout}/route.ts`
- CORE wire calls: `apps/web/src/lib/oauth.ts`
- Session bookkeeping + refresh: `apps/web/src/lib/session.ts`

To call CORE from a Route Handler, read the session id from the cookie,
resolve a fresh access token via `getAccessTokenForSession(sid)`, then:

```ts
fetch(`${CORE_OAUTH_BASE}/api/v1/...`, {
  headers: { authorization: `Bearer ${token}` },
});
```

Inbound webhooks land at `/api/events` and are HMAC-verified against
`TOWN_WEBHOOK_SECRET` (`X-Town-Signature: sha256(secret, rawBody)`).

## Where to read next

- [`AGENTS.md`](./AGENTS.md) — guardrails and quick map for AI agents
- [`packages/catalog/README.md`](./packages/catalog/README.md) — asset catalog model
- [`packages/plot/README.md`](./packages/plot/README.md) — per-user plot schema
- [`packages/plot-gen/README.md`](./packages/plot-gen/README.md) — deterministic generator
- [`docs/variant-catalog-draft.md`](./docs/variant-catalog-draft.md) — variant taxonomy + tone bible
