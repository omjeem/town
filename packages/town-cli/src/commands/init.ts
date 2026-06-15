// `town init` — pull the signed-in user's plot + NPCs into a local
// folder, ready for hand-editing. The layout is:
//
//   <plot-dir>/
//     plot.json           ← the @town/plot Plot blob
//     npcs/<id>.mdx       ← one MDX per NPC, frontmatter = name/description,
//                            body = system prompt
//
// `town deploy` (next pass) reads this directory back and POSTs the
// pieces to /api/plot + /api/npcs. The MDX is the source of truth on the
// editor's machine; the server mirrors it on push.

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

async function ensureEmptyDir(dir: string): Promise<void> {
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
    return;
  }
  const entries = await readdir(dir);
  // Allow "empty enough" — anything other than the files we're about to
  // write would mean an overwrite, so prompt.
  const relevant = entries.filter((e) => e === "plot.json" || e === "npcs");
  if (relevant.length === 0) return;
  const ok = (await p.confirm({
    message: `${dir} already has a plot.json or npcs/ — overwrite?`,
    initialValue: false,
  })) as boolean;
  if (!ok) {
    p.cancel("Aborted");
    process.exit(1);
  }
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

  // Write plot.json.
  const plotPath = join(targetDir, "plot.json");
  await writeFile(plotPath, JSON.stringify(plotResp.plot, null, 2) + "\n");

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

  p.log.success(`Wrote ${basename(plotPath)} + ${npcs.length} NPC file(s) to ${targetDir}`);
  p.outro(chalk.green("Done. Edit the MDX files, then run `town deploy` (coming soon)."));
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
