// NPC chat-data cache.
//
// The interior scene reads NPC *slot* positions from plot.json
// (plot.npcs[]), and NPC *chat data* (name, description, prompt) from the
// per-user `Npc` table behind /api/npcs. This module holds a single
// process-wide snapshot of that DB roster so the renderer can look up a
// row synchronously by `buildingId` while building the SPACE prompt and
// greeting dialogue.
//
// Owner mode hits `/api/npcs`; visitor mode passes `?town=<slug>` so the
// server returns the resident's roster (gated by the visitor cookie).

import { getViewerTownSlug } from "./plotClient";

export type NpcRow = {
  id: string;
  buildingId: string;
  name: string;
  description: string;
  prompt: string;
};

let byBuildingId: Map<string, NpcRow> = new Map();
let inFlight: Promise<void> | null = null;
let listeners: Array<() => void> = [];

export function getNpcByBuildingId(buildingId: string): NpcRow | null {
  return byBuildingId.get(buildingId) ?? null;
}

export function onNpcsChange(fn: () => void): () => void {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((x) => x !== fn);
  };
}

function emit() {
  for (const fn of listeners) fn();
}

function npcsUrl(): string {
  const slug = getViewerTownSlug();
  return slug ? `/api/npcs?town=${encodeURIComponent(slug)}` : "/api/npcs";
}

export async function refreshNpcs(): Promise<void> {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    try {
      const res = await fetch(npcsUrl(), { cache: "no-store" });
      if (!res.ok) {
        byBuildingId = new Map();
      } else {
        const body = (await res.json()) as { npcs?: NpcRow[] };
        const next = new Map<string, NpcRow>();
        for (const n of body.npcs ?? []) {
          next.set(n.buildingId, n);
        }
        byBuildingId = next;
      }
    } catch {
      byBuildingId = new Map();
    } finally {
      inFlight = null;
    }
    emit();
  })();
  return inFlight;
}

/** Kick off one fetch on mount. Returns a teardown so the host component
 *  can clear the cache when the page is torn down. */
export function startNpcsSync(): () => void {
  if (typeof window === "undefined") return () => {};
  void refreshNpcs();
  return () => {
    byBuildingId = new Map();
    listeners = [];
  };
}
