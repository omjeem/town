// System-owned NPCs that ship with the app and appear in every user's
// town regardless of what's in their PlotRow or Npc table. The CORE
// founder is the canonical example — he hangs out at the store and tells
// the player what's coming on the roadmap.
//
// Each system NPC is authored as an .mdx file in apps/web/src/data/
// system-npcs/. We parse the frontmatter at module load to keep the
// file editable as MDX while still being consumable as a typed record.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, basename } from "node:path";

export interface SystemNpc {
  id: string;
  buildingId: string;
  /** Tile position inside the building's interior. */
  tx: number;
  ty: number;
  /** kaplay sprite id to render. */
  sprite: string;
  name: string;
  description: string;
  /** System prompt fed to the LLM when the player talks to this NPC. */
  prompt: string;
}

// Bare-bones frontmatter parser — pulls a leading `---` block, expects
// `key: value` per line. Values are coerced to number when numeric. No
// support for nested objects or multi-line scalars — we don't need it.
function parseMdx(source: string): { meta: Record<string, string | number>; body: string } {
  const meta: Record<string, string | number> = {};
  const fm = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!fm) return { meta, body: source };
  for (const line of fm[1]!.split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(.*)$/);
    if (!m) continue;
    const key = m[1]!;
    const raw = m[2]!.trim().replace(/^["']|["']$/g, "");
    const num = Number(raw);
    meta[key] = Number.isFinite(num) && raw !== "" && /^-?\d+(?:\.\d+)?$/.test(raw)
      ? num
      : raw;
  }
  return { meta, body: fm[2]!.trim() };
}

// Static fallback so the founder always resolves even if the MDX directory
// is missing at runtime (e.g. on a production build that didn't ship the
// `src/data/` source tree). Keep this in sync with
// apps/web/src/data/system-npcs/core-founder.mdx.
const STATIC_FALLBACK: Record<string, SystemNpc> = {
  "core-founder": {
    id: "core-founder",
    buildingId: "store",
    tx: 7,
    ty: 5,
    sprite: "founder",
    name: "Founder",
    description:
      "Visits the corner store. Tracks the CORE roadmap; tells you what's coming.",
    prompt:
      "You are the CORE founder, hanging out at the corner store in this small pixel-art town. You know the product, the roadmap, and the team. Greet the player warmly, be candid about what's shipping and what you're rethinking, redirect off-topic chatter back to CORE. Stay in character, no emojis, replies under three sentences.",
  },
};

function loadSystemNpcs(): Record<string, SystemNpc> {
  // Next runs from apps/web in dev (process.cwd() === <repo>/apps/web)
  // and src/ files are present on disk; in a built deploy we fall back
  // to STATIC_FALLBACK below.
  const candidates = [
    join(process.cwd(), "src", "data", "system-npcs"),
    join(process.cwd(), "apps", "web", "src", "data", "system-npcs"),
  ];
  const dataDir = candidates.find((d) => existsSync(d));
  if (!dataDir) return { ...STATIC_FALLBACK };

  let files: string[];
  try {
    files = readdirSync(dataDir).filter((f) => f.endsWith(".mdx"));
  } catch {
    return { ...STATIC_FALLBACK };
  }
  const out: Record<string, SystemNpc> = { ...STATIC_FALLBACK };
  for (const file of files) {
    const id = basename(file, ".mdx");
    const source = readFileSync(join(dataDir, file), "utf8");
    const { meta, body } = parseMdx(source);
    out[id] = {
      id: String(meta.id ?? id),
      buildingId: String(meta.buildingId ?? ""),
      tx: typeof meta.tx === "number" ? meta.tx : 0,
      ty: typeof meta.ty === "number" ? meta.ty : 0,
      sprite: String(meta.sprite ?? "founder"),
      name: String(meta.name ?? "NPC"),
      description: String(meta.description ?? ""),
      prompt: body,
    };
  }
  return out;
}

let cached: Record<string, SystemNpc> | null = null;

export function getSystemNpcs(): Record<string, SystemNpc> {
  if (cached) return cached;
  cached = loadSystemNpcs();
  return cached;
}

/** All system NPCs that belong to a given building (by buildingId). */
export function getSystemNpcsForBuilding(buildingId: string): SystemNpc[] {
  return Object.values(getSystemNpcs()).filter(
    (n) => n.buildingId === buildingId,
  );
}
