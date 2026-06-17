// Default NPC roster the CLI writes for a freshly-init'd town. Mirrors
// what the server seeds at `pickTown` time — the only difference is
// HOME's `name`, which we bind to the resident's CORE workspace name
// when we can fetch it. After init the user is expected to edit these
// MDX files freely; `town deploy` then replaces the server roster
// wholesale, so the local files become the source of truth.

import matter from "gray-matter";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

interface SeedTemplate {
  buildingId: string;
  defaultName: string;
  description: string;
  prompt: string;
}

const DEFAULT_NPC_TEMPLATES: SeedTemplate[] = [
  {
    buildingId: "home",
    defaultName: "Hudson",
    description:
      "Butler of the world. Greets you when you come home and remembers what's on your mind.",
    prompt: `You are the butler and world runner of this town. You greet the player warmly when they walk in, ask after their day, and reference recent CORE activity when context is provided. Stay in character, never break the fourth wall, and keep replies under three sentences.`,
  },
  {
    buildingId: "library",
    defaultName: "Lior",
    description:
      "Caretaker of the library. Knows what's worth reading next.",
    prompt: `You are the keeper of the town library. You suggest reading, remember the player's prior summaries, and speak quietly but warmly. Stay in character; keep replies under three sentences.`,
  },
  {
    buildingId: "store",
    defaultName: "Sera",
    description:
      "Shopkeeper at the corner store. Tracks the market and small talk.",
    prompt: `You are the shopkeeper at the town store. You greet the player, mention what's in stock, and keep banter friendly. Stay in character; keep replies under three sentences.`,
  },
];

export interface CoreWorkspace {
  id: string;
  name: string;
}

/** Best-effort CORE workspace lookup using the saved CLI PAT. Returns
 *  null if CORE is unreachable, the PAT lacks workspace scope, or the
 *  response doesn't include a name — callers fall back to defaults. */
export async function fetchCoreWorkspace(
  coreUrl: string,
  pat: string,
): Promise<CoreWorkspace | null> {
  try {
    const res = await fetch(`${coreUrl.replace(/\/$/, "")}/api/v1/workspace`, {
      headers: { authorization: `Bearer ${pat}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { id?: string; name?: string };
    if (!body.id || !body.name) return null;
    return { id: body.id, name: body.name };
  } catch {
    return null;
  }
}

/** Write the day-zero NPC roster into <targetDir>/npcs/. HOME's butler
 *  gets named after the resident's workspace when available. */
export async function writeDefaultNpcs(
  targetDir: string,
  workspaceName: string | null,
): Promise<void> {
  const npcDir = join(targetDir, "npcs");
  await mkdir(npcDir, { recursive: true });
  for (const tmpl of DEFAULT_NPC_TEMPLATES) {
    const isButler = tmpl.buildingId === "home";
    const name = isButler && workspaceName ? workspaceName.trim() : tmpl.defaultName;
    const body = matter.stringify(tmpl.prompt.trimEnd() + "\n", {
      buildingId: tmpl.buildingId,
      name,
      description: tmpl.description,
    });
    await writeFile(join(npcDir, `${tmpl.buildingId}.mdx`), body);
  }
}
