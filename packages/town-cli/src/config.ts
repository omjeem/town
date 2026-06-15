// Read/write ~/.town/config.json. Mirrors how CORE's CLI persists its
// PAT in ~/.corebrain/config.json — same shape, separate file so `town`
// and `corebrain` can be authenticated independently if needed.

import { homedir } from "node:os";
import { join } from "node:path";
import { mkdirSync, readFileSync, writeFileSync, existsSync, chmodSync } from "node:fs";

const CONFIG_DIR = join(homedir(), ".town");
const CONFIG_PATH = join(CONFIG_DIR, "config.json");

export interface TownConfig {
  auth?: {
    /** CORE host the PAT was minted from, e.g. https://app.getcore.me */
    coreUrl: string;
    /** Town server the CLI talks to, e.g. https://town.example or http://localhost:3000 */
    townUrl: string;
    /** The CORE PAT. Town's `/api/*` accepts this directly as a Bearer. */
    pat: string;
  };
}

export function getConfigPath(): string {
  return CONFIG_PATH;
}

export function getConfig(): TownConfig {
  if (!existsSync(CONFIG_PATH)) return {};
  try {
    return JSON.parse(readFileSync(CONFIG_PATH, "utf8")) as TownConfig;
  } catch {
    return {};
  }
}

export function updateConfig(patch: TownConfig): TownConfig {
  const next: TownConfig = { ...getConfig(), ...patch };
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
  }
  writeFileSync(CONFIG_PATH, JSON.stringify(next, null, 2) + "\n");
  // 0600 — the file holds a PAT.
  try {
    chmodSync(CONFIG_PATH, 0o600);
  } catch {
    // chmod can fail on Windows; tolerable.
  }
  return next;
}

export function clearAuth(): void {
  const next = getConfig();
  delete next.auth;
  if (existsSync(CONFIG_DIR)) {
    writeFileSync(CONFIG_PATH, JSON.stringify(next, null, 2) + "\n");
  }
}
