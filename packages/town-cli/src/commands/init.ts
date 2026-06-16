// `town init` — pull the signed-in user's plot + NPCs into a local
// folder, ready for hand-editing. The layout is:
//
//   <plot-dir>/
//     plot.json           ← the @town/plot Plot blob (your map)
//     catalog.json        ← every available building plot + variant
//                            (read-only reference for what you can put
//                            in plot.json)
//     manifest.json       ← every available decor sprite (trees,
//                            bushes, flowers, …) — same idea, read-only
//     npcs/<id>.mdx       ← one MDX per NPC, frontmatter = name/description,
//                            body = system prompt
//     AGENTS.md           ← short orientation for coding agents
//                            (Claude, Codex, …) that edit this folder
//
// `town deploy` reads this directory back and POSTs the pieces to
// /api/plot + /api/npcs. The local files are the source of truth
// during editing; the server mirrors them on push.

import { Command } from "commander";
import * as p from "@clack/prompts";
import chalk from "chalk";
import matter from "gray-matter";
import { mkdir, readdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, join, basename } from "node:path";

import { getConfig } from "../config.js";

interface PlotResponse {
  plot: unknown;
  version: number;
}

interface NpcDTO {
  id: string;
  buildingId: string;
  name: string;
  description: string;
  prompt: string;
}

async function fetchJson<T>(url: string, pat: string): Promise<T> {
  const res = await fetch(url, {
    headers: { authorization: `Bearer ${pat}` },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`GET ${url} → ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as T;
}

// Same as fetchJson, but for the public static-asset endpoints
// (catalog + manifest). No auth, no body shape — we just persist what
// the server hands back.
async function fetchPublicJson(url: string): Promise<unknown> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`GET ${url} → ${res.status} ${await res.text()}`);
  }
  return await res.json();
}

async function ensureEmptyDir(dir: string): Promise<void> {
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
    return;
  }
  const entries = await readdir(dir);
  // Allow "empty enough" — anything other than the files we're about to
  // write would mean an overwrite, so prompt.
  const relevant = entries.filter(
    (e) =>
      e === "plot.json" ||
      e === "catalog.json" ||
      e === "manifest.json" ||
      e === "AGENTS.md" ||
      e === "npcs",
  );
  if (relevant.length === 0) return;
  const ok = (await p.confirm({
    message: `${dir} already has plot.json / catalog.json / manifest.json / AGENTS.md / npcs — overwrite?`,
    initialValue: false,
  })) as boolean;
  if (!ok) {
    p.cancel("Aborted");
    process.exit(1);
  }
}

// Short README for coding agents. Tells Claude / Codex / etc. how the
// folder is laid out and which files they should consult before
// proposing edits to plot.json.
function agentsMarkdown(): string {
  return `# Town plot — local edit folder

This folder mirrors your town on the server. \`town deploy\` pushes any
local changes back.

## Files

- \`plot.json\` — the live map. Buildings, paths, ponds, and decor.
  Schema is \`@town/plot\`'s \`Plot\` type.
- \`catalog.json\` — every available **building** plot + variant. Each
  entry has a \`plotKey\` (use as \`plot.buildings[i].plotKey\`), one
  or more variants (use the \`id\` as \`plot.buildings[i].variantId\`),
  and an \`exteriorSpriteCandidates\` list — the first entry is the
  default sprite to use for \`plot.buildings[i].exteriorSprite\`.
- \`manifest.json\` — every available **decor** sprite, keyed by
  group: \`trees\`, \`bushes\`, \`flowers\`, \`stumps\`, \`grass\`,
  \`mushrooms\`, \`rocks\`, \`dirtPatches\`, \`apron\`. For each
  decor entry in \`plot.json\` set \`group\` to the key and
  \`spriteId\` to one of that group's \`id\` values.
- \`npcs/<buildingId>.mdx\` — one NPC per building. Frontmatter is
  identity (\`name\`, \`description\`, \`buildingId\`), body is the
  system prompt the runtime feeds the LLM.

## Editing rules

- Tile size is 16px. World bounds are \`plot.world.w × plot.world.h\`
  tiles. Every building footprint, path tile, pond rect, and decor
  position must fit inside.
- Building footprints can't overlap. Doors are derived from the south
  edge of each building, so leave a free tile south of every
  \`(tx, ty, w, h)\` for the door + path.
- Paths and ponds auto-tile from the set of \`(tx, ty)\` cells you
  list — you don't pick edge/corner sprites by hand.

## Commands

- \`town deploy\` — push \`plot.json\` and every NPC under \`npcs/\` to
  the server. Server validates the plot against \`catalog.json\` +
  \`manifest.json\`; if validation fails, the deploy aborts and the
  CLI prints the issues.
`;
}

function npcToMdx(npc: NpcDTO): string {
  return matter.stringify(npc.prompt.trimEnd() + "\n", {
    id: npc.id,
    buildingId: npc.buildingId,
    name: npc.name,
    description: npc.description,
  });
}

async function runInit(opts: { dir?: string }): Promise<void> {
  p.intro(chalk.bgCyan(chalk.black(" town init ")));

  const cfg = getConfig();
  if (!cfg.auth?.pat || !cfg.auth.townUrl) {
    p.cancel("Not logged in — run `town login` first.");
    process.exit(1);
  }
  const { townUrl, pat } = cfg.auth;

  // Where to write. Either explicit --dir flag, prompt for cwd vs new,
  // or default to a `town/` subdir.
  let targetDir: string;
  if (opts.dir) {
    targetDir = resolve(process.cwd(), opts.dir);
  } else {
    const choice = (await p.select({
      message: "Where should the plot live?",
      options: [
        { value: "cwd", label: `Current folder (${process.cwd()})` },
        { value: "new", label: "Create a new folder" },
      ],
      initialValue: "new",
    })) as "cwd" | "new";
    if (p.isCancel(choice)) {
      p.cancel("init cancelled");
      return;
    }
    if (choice === "cwd") {
      targetDir = process.cwd();
    } else {
      const name = (await p.text({
        message: "Folder name",
        placeholder: "my-town",
        initialValue: "my-town",
      })) as string;
      if (p.isCancel(name)) {
        p.cancel("init cancelled");
        return;
      }
      targetDir = resolve(process.cwd(), name);
    }
  }
  await ensureEmptyDir(targetDir);

  const spinner = p.spinner();
  spinner.start("Fetching plot...");
  let plotResp: PlotResponse;
  try {
    plotResp = await fetchJson<PlotResponse>(`${townUrl}/api/plot`, pat);
  } catch (err) {
    spinner.stop(chalk.red("Failed to fetch plot"));
    p.outro(chalk.red(err instanceof Error ? err.message : "unknown error"));
    process.exit(1);
  }
  spinner.stop(chalk.green(`Fetched plot v${plotResp.version}`));

  spinner.start("Fetching NPCs...");
  let npcs: NpcDTO[] = [];
  try {
    const r = await fetchJson<{ npcs: NpcDTO[] }>(`${townUrl}/api/npcs`, pat);
    npcs = r.npcs;
  } catch (err) {
    spinner.stop(chalk.yellow("NPC fetch failed; continuing with empty roster"));
    p.log.warn(err instanceof Error ? err.message : "unknown error");
  }
  spinner.stop(chalk.green(`Fetched ${npcs.length} NPC(s)`));

  // Pull the catalog + decor manifest so coding agents editing this
  // folder don't have to guess which buildings/decor exist. Both files
  // are served as static assets from the town server (apps/web/public).
  spinner.start("Fetching catalog + manifest...");
  let catalog: unknown = null;
  let manifest: unknown = null;
  try {
    catalog = await fetchPublicJson(
      `${townUrl}/sprites/catalog/variants.json`,
    );
    manifest = await fetchPublicJson(
      `${townUrl}/sprites/extras/MANIFEST.json`,
    );
    spinner.stop(chalk.green("Fetched catalog + manifest"));
  } catch (err) {
    spinner.stop(
      chalk.yellow("Catalog/manifest fetch failed; AGENTS.md will be sparse"),
    );
    p.log.warn(err instanceof Error ? err.message : "unknown error");
  }

  // Write plot.json.
  const plotPath = join(targetDir, "plot.json");
  await writeFile(plotPath, JSON.stringify(plotResp.plot, null, 2) + "\n");

  // Write catalog + manifest if we got them. Keeping these alongside
  // plot.json means coding agents can grep / cat for available assets
  // without round-tripping to the server.
  if (catalog) {
    await writeFile(
      join(targetDir, "catalog.json"),
      JSON.stringify(catalog, null, 2) + "\n",
    );
  }
  if (manifest) {
    await writeFile(
      join(targetDir, "manifest.json"),
      JSON.stringify(manifest, null, 2) + "\n",
    );
  }

  // Orientation file. Plain markdown so it shows up nicely in editors
  // AND in the file lists agents like Claude Code surface by default.
  await writeFile(join(targetDir, "AGENTS.md"), agentsMarkdown());

  // Write npcs/<buildingId>.mdx — one per NPC. We key on buildingId
  // (one NPC per building today) so the filename is meaningful when you
  // open the folder in an editor.
  const npcDir = join(targetDir, "npcs");
  await mkdir(npcDir, { recursive: true });
  for (const npc of npcs) {
    const safe = npc.buildingId.replace(/[^a-z0-9_-]+/gi, "-");
    const file = join(npcDir, `${safe}.mdx`);
    await writeFile(file, npcToMdx(npc));
  }

  p.log.success(
    `Wrote ${basename(plotPath)} + ${npcs.length} NPC file(s) + catalog/manifest/AGENTS.md to ${targetDir}`,
  );
  p.outro(
    chalk.green("Done. Edit, then run `town deploy` to push back."),
  );
}

export function registerInit(program: Command): void {
  program
    .command("init")
    .description("Download your plot + NPCs into a local folder")
    .option(
      "-d, --dir <path>",
      "Target folder. Without this flag the CLI prompts for cwd vs new folder.",
    )
    .action(async (opts: { dir?: string }) => {
      await runInit(opts);
    });
}
