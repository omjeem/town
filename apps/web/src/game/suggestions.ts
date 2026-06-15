// Suggestions poller — keeps the pending PlotSuggestion list fresh.
//
// Drives the top-right HUD badge ("3 new") and the right sidebar contents.
// Polls /api/suggestions while the user is signed in. Drops everything to
// zero when signed out (the API would 401 anyway).

import type { SuggestionItem } from "../ui/store";
import { ui } from "../ui/store";
import { getSession, onSessionChange } from "./auth";

const POLL_MS = 15_000;

let timer: number | null = null;

type SuggestionsResponse = {
  suggestions: SuggestionItem[];
  count: number;
};

export async function refreshSuggestions(): Promise<void> {
  if (!getSession()) {
    ui.setSuggestions({
      count: 0,
      list: [],
      fetchedAt: new Date().toISOString(),
    });
    return;
  }
  try {
    const res = await fetch("/api/suggestions", { cache: "no-store" });
    if (!res.ok) {
      ui.setSuggestions({
        count: 0,
        list: [],
        fetchedAt: new Date().toISOString(),
      });
      return;
    }
    const body = (await res.json()) as SuggestionsResponse;
    ui.setSuggestions({
      count: body.count ?? 0,
      list: body.suggestions ?? [],
      fetchedAt: new Date().toISOString(),
    });
  } catch {
    // Silent — the next tick will retry.
  }
}

export async function approveSuggestion(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/suggestions/${encodeURIComponent(id)}/approve`, {
      method: "POST",
    });
    if (!res.ok) return false;
    ui.removeSuggestion(id);
    return true;
  } catch {
    return false;
  }
}

export async function declineSuggestion(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/suggestions/${encodeURIComponent(id)}/decline`, {
      method: "POST",
    });
    if (!res.ok) return false;
    ui.removeSuggestion(id);
    return true;
  } catch {
    return false;
  }
}

function start() {
  if (timer !== null) return;
  void refreshSuggestions();
  timer = window.setInterval(() => {
    void refreshSuggestions();
  }, POLL_MS);
}

function stop() {
  if (timer === null) return;
  window.clearInterval(timer);
  timer = null;
  ui.setSuggestions({
    count: 0,
    list: [],
    fetchedAt: new Date().toISOString(),
  });
}

export function startSuggestionsPoller() {
  if (typeof window === "undefined") return () => {};
  if (getSession()) start();
  const unsub = onSessionChange((s) => {
    if (s) start();
    else stop();
  });
  return () => {
    unsub();
    stop();
  };
}
