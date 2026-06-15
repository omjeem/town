// Workspace cache.
//
// HOME's NPC borrows her name from workspace.name and her dialogue accent
// from workspace.accentColor. We fetch /api/core/workspace once after sign-in
// and stash it in module memory; the HOME NPC trigger reads from this
// snapshot synchronously when SPACE is pressed.
//
// Auto-refreshes whenever the auth session changes (sign-in, sign-out,
// re-login as a different user / workspace).

import { getSession, onSessionChange } from "./auth";

export type Workspace = {
  id: string;
  name: string;
  accentColor: string;
};

let cached: Workspace | null = null;
let inFlight: Promise<Workspace | null> | null = null;

let listeners: Array<(w: Workspace | null) => void> = [];

export function getWorkspace(): Workspace | null {
  return cached;
}

export function onWorkspaceChange(
  fn: (w: Workspace | null) => void,
): () => void {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((x) => x !== fn);
  };
}

function emit() {
  for (const fn of listeners) fn(cached);
}

export async function refreshWorkspace(): Promise<Workspace | null> {
  if (!getSession()) {
    if (cached !== null) {
      cached = null;
      emit();
    }
    return null;
  }
  if (inFlight) return inFlight;
  inFlight = (async () => {
    try {
      const res = await fetch("/api/core/workspace", { cache: "no-store" });
      if (!res.ok) {
        cached = null;
      } else {
        const body = (await res.json()) as Partial<Workspace>;
        if (body && body.id && body.name) {
          cached = {
            id: body.id,
            name: body.name,
            accentColor: body.accentColor ?? "#c87844",
          };
        } else {
          cached = null;
        }
      }
    } catch {
      cached = null;
    } finally {
      inFlight = null;
    }
    emit();
    return cached;
  })();
  return inFlight;
}

// Wire to auth so we always have a fresh workspace when the user lands on
// the world after sign-in. Called once from TownGame's mount effect.
export function startWorkspaceSync() {
  if (typeof window === "undefined") return () => {};
  void refreshWorkspace();
  const unsub = onSessionChange((s) => {
    if (s) void refreshWorkspace();
    else {
      cached = null;
      emit();
    }
  });
  return unsub;
}
