// `town deploy` — push the local plot folder back to the town server.
//
// Reads:
//   <plot-dir>/plot.json          → POST /api/plot   { plot }
//   <plot-dir>/npcs/<id>.mdx (*)  → POST /api/npcs   { npcs: [...] }
//
// MDX frontmatter shape (matches what `town init` wrote):
//   ---
//   id: cuid (optional — preserved when present)
//   buildingId: <plot.buildings[].id>
//   name: <display name>
//   description: <one-line blurb>
//   ---
//   <system prompt body>
//
// Server validates the plot against the catalog + manifest. On a
// validation failure the deploy aborts and we surface the issues
// verbatim — they're useful for both humans and coding agents that
// might be iterating against the local copy.
//
// Auth: the CORE PAT saved by `town login`. Both endpoints accept it
// as `Authorization: Bearer <pat>`.

import { Command } from "commander";
import * as p from "@clack/prompts";
import chalk from "chalk";
import matter from "gray-matter";
import { readFile, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, join } from "node:path";

import { getConfig } from "../config.js";

interface NpcPayload {
  id?: string;
  buildingId: string;
  name: string;
  description: string;
  prompt: string;
}

async function readPlot(dir: string): Promise<unknown> {
  const plotPath = join(dir, "plot.json");
  if (!existsSync(plotPath)) {
    throw new Error(`No plot.json in ${dir} — is this a town init folder?`);
  }
  const raw = await readFile(plotPath, "utf8");
  try {
    return JSON.parse(raw);
  } catch (e) {
    throw new Error(
      `plot.json isn't valid JSON: ${e instanceof Error ? e.message : e}`,
    );
  }
}

async function readNpcs(dir: string): Promise<NpcPayload[]> {
  const npcDir = join(dir, "npcs");
  if (!existsSync(npcDir)) return [];
  const npcStat = await stat(npcDir);
  if (!npcStat.isDirectory()) return [];
  const entries = await readdir(npcDir);
  const mdx = entries.filter((e) => e.endsWith(".mdx") || e.endsWith(".md"));

  const out: NpcPayload[] = [];
  for (const file of mdx) {
    const full = join(npcDir, file);
    const raw = await readFile(full, "utf8");
    const parsed = matter(raw);
    const data = parsed.data as Record<string, unknown>;

    const buildingId =
      typeof data.buildingId === "string" ? data.buildingId : "";
    const name = typeof data.name === "string" ? data.name : "";
    const description =
      typeof data.description === "string" ? data.description : "";
    const id = typeof data.id === "string" ? data.id : undefined;

    if (!buildingId) {
      throw new Error(
        `${file}: frontmatter is missing \`buildingId\` — can't decide which building this NPC lives in.`,
      );
    }
    if (!name) {
      throw new Error(`${file}: frontmatter is missing \`name\`.`);
    }

    out.push({
      ...(id ? { id } : {}),
      buildingId,
      name,
      description,
      prompt: parsed.content.trim(),
    });
  }
  return out;
}

interface PlotPostError {
  error?: string;
  detail?: string;
  issues?: Array<{ path?: string; message?: string }>;
}

async function postJson<T>(
  url: string,
  body: unknown,
  pat: string,
): Promise<{ ok: true; data: T } | { ok: false; status: number; body: PlotPostError }> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${pat}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let parsed: PlotPostError = {};
    try {
      parsed = (await res.json()) as PlotPostError;
    } catch {
      // server didn't bother with JSON; keep an empty body
    }
    return { ok: false, status: res.status, body: parsed };
  }
  return { ok: true, data: (await res.json()) as T };
}

async function runDeploy(opts: { dir?: string }): Promise<void> {
  p.intro(chalk.bgCyan(chalk.black(" town deploy ")));

  const cfg = getConfig();
  if (!cfg.auth?.pat || !cfg.auth.townUrl) {
    p.cancel("Not logged in — run `town login` first.");
    process.exit(1);
  }
  const { townUrl, pat } = cfg.auth;

  const dir = resolve(process.cwd(), opts.dir ?? ".");
  if (!existsSync(dir)) {
    p.cancel(`No such folder: ${dir}`);
    process.exit(1);
  }

  // Stage every read up front so we don't half-deploy when one file is
  // malformed.
  let plot: unknown;
  let npcs: NpcPayload[];
  try {
    plot = await readPlot(dir);
    npcs = await readNpcs(dir);
  } catch (err) {
    p.cancel(err instanceof Error ? err.message : "unknown error reading files");
    process.exit(1);
  }

  const spinner = p.spinner();

  // 1. Plot.
  spinner.start("Uploading plot…");
  const plotRes = await postJson<{ version: number }>(
    `${townUrl}/api/plot`,
    { plot },
    pat,
  );
  if (!plotRes.ok) {
    spinner.stop(chalk.red(`Plot upload failed (${plotRes.status})`));
    if (plotRes.body.error) {
      p.log.error(`error: ${plotRes.body.error}`);
    }
    if (plotRes.body.issues && plotRes.body.issues.length > 0) {
      p.log.error("Validation issues:");
      for (const issue of plotRes.body.issues) {
        p.log.error(`  • ${issue.path ?? "(root)"}: ${issue.message ?? "?"}`);
      }
    } else if (plotRes.body.detail) {
      p.log.error(plotRes.body.detail);
    }
    p.outro(chalk.red("Deploy aborted — fix plot.json and try again."));
    process.exit(1);
  }
  spinner.stop(chalk.green(`Plot uploaded (v${plotRes.data.version})`));

  // 2. NPCs (bulk replace).
  spinner.start(`Uploading ${npcs.length} NPC(s)…`);
  const npcRes = await postJson<{ count: number }>(
    `${townUrl}/api/npcs`,
    { npcs },
    pat,
  );
  if (!npcRes.ok) {
    spinner.stop(chalk.red(`NPC upload failed (${npcRes.status})`));
    if (npcRes.body.error) p.log.error(`error: ${npcRes.body.error}`);
    if (npcRes.body.detail) p.log.error(npcRes.body.detail);
    p.outro(chalk.red("Plot was saved, but NPC roster wasn't updated."));
    process.exit(1);
  }
  spinner.stop(chalk.green(`NPC roster replaced (${npcRes.data.count} row(s))`));

  p.outro(
    chalk.green(
      `Done. Visit ${townUrl} to see your changes.`,
    ),
  );
}

export function registerDeploy(program: Command): void {
  program
    .command("deploy")
    .description("Push local plot.json + npcs/*.mdx back to the town server")
    .option(
      "-d, --dir <path>",
      "Folder containing plot.json + npcs/. Defaults to the current directory.",
    )
    .action(async (opts: { dir?: string }) => {
      await runDeploy(opts);
    });
}
