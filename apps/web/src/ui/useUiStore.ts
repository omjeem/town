"use client";

import { useSyncExternalStore } from "react";
import { ui } from "./store";

// Hook into the UI bridge store from React components. Kaplay scenes call
// ui.setHud / ui.setPrompt / ui.openPanel etc.; components re-render here.
export function useUiState() {
  return useSyncExternalStore(
    ui.subscribe,
    ui.getState,
    ui.getState, // server snapshot (same as client — store is client-only)
  );
}
