// UI store — the bridge between kaplay (which simulates the world) and React
// (which renders all UI surfaces: HUD, SPACE prompt, modals, login form, etc.).
//
// Kaplay scenes call setters (setHud, setPrompt, openPanel) to publish UI
// state. React subscribes with useSyncExternalStore and re-renders. No
// engine cares about the other's internals.
//
// Pause semantics: when any modal is open, the game world should freeze.
// Player movement reads `getState().paused` and skips frames while true.

import type { Session } from "../game/auth";

export type HudKind =
  | { kind: "overworld"; session: Session | null }
  | { kind: "interior"; title: string; accent: string };

export type PromptState = {
  // Shown in the floating bottom-center SPACE prompt. Null = no prompt.
  label: string;
  accent: string;
} | null;

export type PanelAction = {
  label: string;
  onPress: () => void;
};

export type PanelState = {
  title: string;
  lines: string[];
  accent: string;
  action?: PanelAction;
  // Used to identify which interactable is open so an action can re-resolve
  // and re-publish the panel (e.g. profile flips guest→signed in).
  key: string;
} | null;

// Memory explorer overlay (LIBRARY → table interaction). Null = closed.
export type ExplorerState = { open: true } | null;

// Tasks overlay (OFFICE → desk interaction). Null = closed.
export type TasksState = { open: true } | null;

// Share modal — opened from the identity card dropdown.
export type ShareState = { open: true } | null;

// Reusable typewriter dialogue (HOME NPC, future NPCs). Lines render one at
// a time and the action button reveals after the last line finishes.
export type DialogueAction = {
  label: string;
  onPress: () => void;
};

export type DialogueState = {
  // Used to identify the same dialogue across re-renders (avoids restart
  // when the same NPC re-publishes a follow-up).
  key: string;
  speaker: string;            // e.g. "Hudson" or NPC name
  lines: string[];            // each line types out before the next starts
  accent: string;
  action?: DialogueAction;    // primary action revealed at the end
  // Optional secondary action (e.g. "Not now") shown alongside the primary.
  secondary?: DialogueAction;
} | null;

// Streaming NPC chat overlay. Wired to /api/npc-chat which speaks the
// AI-SDK UI message protocol. Mode controls whether the LLM is briefed as
// a direct 1:1 with the player, or as a chat the player has invited
// someone into (the invitee is just a label in the system prompt today).
export type ChatState = {
  npcId: string;
  speaker: string;
  description: string;
  accent: string;
  mode?: "direct" | "invited";
  invitee?: { name: string };
} | null;

// Unread VoiceInboxMessage count from CORE. Drives the overworld badge +
// the HOME NPC greeting branching.
export type InboxState = {
  count: number;
  // ISO timestamp of the last successful poll — used for "as of HH:MM".
  fetchedAt: string;
};

// Currently playing Spotify track (CORE integration). Driven by
// /api/core/spotify/now-playing on a 10s poll. Card hides itself when
// `connected` is false or `playing` is false.
export type NowPlayingState = {
  connected: boolean;
  playing: boolean;
  track?: {
    name: string;
    artists: string;
    album: string | null;
    albumImage: string | null;
    progressMs: number;
    durationMs: number;
    url: string | null;
  };
};

type State = {
  hud: HudKind | null;
  prompt: PromptState;
  panel: PanelState;
  explorer: ExplorerState;
  tasks: TasksState;
  dialogue: DialogueState;
  chat: ChatState;
  inbox: InboxState;
  nowPlaying: NowPlayingState;
  share: ShareState;
};

let state: State = {
  hud: null,
  prompt: null,
  panel: null,
  explorer: null,
  tasks: null,
  dialogue: null,
  chat: null,
  inbox: { count: 0, fetchedAt: new Date(0).toISOString() },
  nowPlaying: { connected: false, playing: false },
  share: null,
};

const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export const ui = {
  getState(): State {
    return state;
  },

  subscribe(fn: () => void): () => void {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },

  setHud(hud: HudKind | null) {
    state = { ...state, hud };
    emit();
  },

  setPrompt(prompt: PromptState) {
    state = { ...state, prompt };
    emit();
  },

  openPanel(panel: NonNullable<PanelState>) {
    state = { ...state, panel, prompt: null };
    emit();
  },

  closePanel() {
    if (!state.panel) return;
    state = { ...state, panel: null };
    emit();
  },

  openExplorer() {
    state = { ...state, explorer: { open: true }, prompt: null };
    emit();
  },

  closeExplorer() {
    if (!state.explorer) return;
    state = { ...state, explorer: null };
    emit();
  },

  openTasks() {
    state = { ...state, tasks: { open: true }, prompt: null };
    emit();
  },

  closeTasks() {
    if (!state.tasks) return;
    state = { ...state, tasks: null };
    emit();
  },

  openDialogue(dialogue: NonNullable<DialogueState>) {
    state = { ...state, dialogue, prompt: null };
    emit();
  },

  closeDialogue() {
    if (!state.dialogue) return;
    state = { ...state, dialogue: null };
    emit();
  },

  openChat(chat: NonNullable<ChatState>) {
    state = { ...state, chat, dialogue: null, prompt: null };
    emit();
  },

  closeChat() {
    if (!state.chat) return;
    state = { ...state, chat: null };
    emit();
  },

  setInbox(inbox: InboxState) {
    state = { ...state, inbox };
    emit();
  },

  setNowPlaying(nowPlaying: NowPlayingState) {
    state = { ...state, nowPlaying };
    emit();
  },

  openShare() {
    state = { ...state, share: { open: true }, prompt: null };
    emit();
  },

  closeShare() {
    if (!state.share) return;
    state = { ...state, share: null };
    emit();
  },

  // Convenience for kaplay player movement code: pause the world while a
  // modal-style surface is open so SPACE/ESC/typing-into-forms don't
  // double-trigger. Ambient overlays like the NPC dialogue intentionally
  // skip this so the player can still walk away and have the overlay
  // auto-close on departure (see autoTrigger in interior.ts).
  isPaused(): boolean {
    return (
      state.panel !== null ||
      state.explorer !== null ||
      state.tasks !== null ||
      state.chat !== null ||
      state.share !== null
    );
  },
};
