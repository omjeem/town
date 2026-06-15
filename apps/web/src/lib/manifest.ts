// Server-side loader for the extras MANIFEST.json.
//
// Cached at module level so repeat reads (validation, plot rendering,
// /api/plot POST) share a single decode. The file ships in /public so
// the path resolves off process.cwd().

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import type { Manifest } from "@town/plot";

let cache: Manifest | null = null;

export function loadManifest(): Manifest {
  if (cache) return cache;
  const path = resolve(
    process.cwd(),
    "public",
    "sprites",
    "extras",
    "MANIFEST.json",
  );
  cache = JSON.parse(readFileSync(path, "utf8")) as Manifest;
  return cache;
}
