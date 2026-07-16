// Auto-greeting handshake between Chat.tsx and the NPC chat routes.
//
// Flow:
//   1. When the chat panel opens with no prior turns, the client fires
//      one hidden user message whose text is `AUTO_GREET_TRIGGER`.
//   2. Every chat route (`/api/npc-chat`, `/api/founder-chat`,
//      `/api/guide-chat`) runs the message list through
//      `replaceAutoGreetInMessages` before handing it to the model — the
//      sentinel text gets rewritten in place to `AUTO_GREET_PROMPT`, an
//      instruction telling the NPC to deliver their opening line.
//   3. Client-side, Chat.tsx filters user messages whose sole text is
//      the sentinel out of the visible transcript. The player never sees
//      the trigger; they just see the NPC speak first.
//
// The rewrite runs on every request (not just the first) because the
// trigger stays in the message history — the client sends it back on
// subsequent turns, and we want the model's context to keep reading a
// coherent "player walked up → NPC greeted → player replied" flow, not
// a raw sentinel string.

import type { UIMessage } from "ai";

/** Sentinel text the client sends as the first user message to prime the
 *  NPC's opening reply. Angle-brackets + snake-case so a human never
 *  types it by accident. Shared with Chat.tsx. */
export const AUTO_GREET_TRIGGER = "<<npc-auto-greet>>";

/** What the model actually sees in place of the trigger. Written as an
 *  out-of-character stage direction so every NPC persona handles it the
 *  same way regardless of their voice. */
const AUTO_GREET_PROMPT =
  "[The player just walked up to you. Deliver your opening line right now per your persona — greet them proactively without asking what they need first. This is your first turn with them; make it count.]";

/** True when a UIMessage is the auto-greet sentinel — a user turn whose
 *  text parts are exactly the trigger string. Exposed so the client can
 *  filter it out of the visible transcript. */
export function isAutoGreetMessage(m: UIMessage): boolean {
  if (m.role !== "user") return false;
  const parts = m.parts ?? [];
  if (parts.length === 0) return false;
  for (const p of parts) {
    if (p.type !== "text") return false;
    if ((p as { text?: string }).text !== AUTO_GREET_TRIGGER) return false;
  }
  return true;
}

/** Rewrite every text part whose value is the sentinel to the real
 *  greeting prompt. Idempotent — safe to call once per turn even though
 *  the trigger stays in history across turns. Returns a new array; the
 *  input is not mutated. */
export function replaceAutoGreetInMessages(messages: UIMessage[]): UIMessage[] {
  return messages.map((m) => {
    if (m.role !== "user") return m;
    let touched = false;
    const nextParts = (m.parts ?? []).map((p) => {
      if (p.type !== "text") return p;
      const raw = p as { type: "text"; text?: string };
      if (raw.text !== AUTO_GREET_TRIGGER) return p;
      touched = true;
      return { ...raw, text: AUTO_GREET_PROMPT };
    });
    if (!touched) return m;
    return { ...m, parts: nextParts } as UIMessage;
  });
}
