// Decides whether an NPC should chime into the room after a human
// message, and which one. One small `generateObject` call per non-
// cooled-down message; the model reads the recent conversation and
// either picks an NPC by id or returns null (silence).
//
// We deliberately don't try to do the picking with regex heuristics
// any more — "tell me another joke" should re-engage the joke teller
// without us maintaining a phrase list, and the LLM handles that
// naturally. Cost is bounded:
//
//   • Hard ROOM_COOLDOWN_MS gate runs first — if any NPC spoke
//     within the cooldown window we skip the call entirely. That
//     filters out the common "humans firing off messages back to
//     back" case before we burn tokens.
//   • generateObject with a tiny schema returns ~10 output tokens
//     per call. Input is bounded by HISTORY_TURNS_MAX of the recent
//     messages we already had to fetch for stage 2 anyway.
//
// State is in-process: just one Map keyed by channelId tracking the
// last NPC-speak timestamp. Same single-container caveat as before;
// move to Redis if the server ever scales horizontally.

import { generateObject } from "ai";
import { z } from "zod";

import { getChatModel } from "@/lib/chat-model";

const ROOM_COOLDOWN_MS = 8_000;

// channelId → last NPC speak timestamp (ms). Cheap rate limit so a
// noisy room can't trigger an NPC reply on every human turn.
const roomLastSpeak = new Map<string, number>();

export interface NpcCandidate {
  id: string;
  name: string;
  /** One-line role description (the `Npc.description` field). Helps
   *  the moderator decide which NPC fits the current topic. */
  description: string;
}

export interface ModeratorPick {
  npc: NpcCandidate;
  /** True when the model judged that the most recent message was
   *  addressed to this NPC (vs. an ambient drop-in). Stage 2 uses
   *  it to tighten the reply prompt. */
  addressed: boolean;
}

/** A single row in the recent-history slice we feed the moderator.
 *  Same shape stage 2 sees, so the route handler can pass the same
 *  slice to both. */
export interface HistoryRow {
  authorKey: string;
  authorName: string;
  text: string;
  isNpc: boolean;
}

// Both fields are REQUIRED. OpenAI's strict JSON-schema mode (which
// the AI SDK uses for generateObject) rejects optional properties —
// every key in `properties` has to be in `required`. So we keep
// `addressed` required and just have the model send `false` when it
// picks silence (npcId === null). Same effect, no schema fight.
const PickSchema = z.object({
  /** NPC id to respond, or null when nobody should speak. */
  npcId: z
    .string()
    .nullable()
    .describe(
      "id of the NPC who should reply, or null when silence is best",
    ),
  /** Did the latest message address this NPC directly (by name,
   *  follow-up, etc.)? Used to bias the reply tone. Send false when
   *  npcId is null. */
  addressed: z
    .boolean()
    .describe(
      "true if the latest message clearly addressed the picked NPC; false otherwise (including when npcId is null)",
    ),
});

const SYSTEM_PROMPT = `You moderate turn-taking in a small multi-party room chat.
Players (humans) and a handful of in-character NPCs share the room.

Your only job: read the recent conversation and pick AT MOST ONE NPC
to reply to the latest message. Prefer silence (npcId: null) when the
humans are clearly talking to each other, when the message is trivial
("ok", "lol", "namaste"), or when no listed NPC has anything useful
to add.

Pick rules:
- If the latest message names an NPC, that NPC should usually reply.
- If it's a clear follow-up to an NPC's previous turn ("tell me
  another", "more please", "what about X"), the same NPC should
  reply.
- If it's a question that an NPC's role makes them the natural
  answerer, that NPC should reply.
- Otherwise: silence is the default.

Set addressed: true when the latest message is plainly aimed at the
picked NPC; false when they're chiming in ambiently.

Never pick an NPC who isn't in the supplied list. Never invent ids.`;

export async function pickResponder(
  channelId: string,
  history: HistoryRow[],
  npcs: NpcCandidate[],
): Promise<ModeratorPick | null> {
  if (npcs.length === 0) return null;
  if (history.length === 0) return null;

  const now = Date.now();
  const lastRoom = roomLastSpeak.get(channelId) ?? 0;
  if (now - lastRoom < ROOM_COOLDOWN_MS) return null;

  let model;
  try {
    model = getChatModel();
  } catch {
    // No LLM configured — silent fallback. The room still works as a
    // human-only chat.
    return null;
  }

  const npcList = npcs
    .map((n) => `- id="${n.id}", name="${n.name}", role="${n.description}"`)
    .join("\n");
  const recent = history
    .map((r) => `[${r.isNpc ? `${r.authorName} (npc)` : r.authorName}] ${r.text}`)
    .join("\n");
  const userPrompt = [
    "NPCs in the room:",
    npcList,
    "",
    "Recent conversation (oldest → newest):",
    recent,
    "",
    "Pick at most one NPC id from the list above to reply to the",
    "latest message, or return null for silence.",
  ].join("\n");

  let pick;
  try {
    const result = await generateObject({
      model,
      schema: PickSchema,
      system: SYSTEM_PROMPT,
      prompt: userPrompt,
    });
    pick = result.object;
  } catch (e) {
    console.warn("[group-chat] moderator generateObject failed", e);
    return null;
  }

  if (!pick.npcId) return null;
  const picked = npcs.find((n) => n.id === pick.npcId);
  if (!picked) {
    // Model returned an id we didn't ship — treat as silence.
    console.warn(
      `[group-chat] moderator picked unknown npcId="${pick.npcId}"`,
    );
    return null;
  }

  return { npc: picked, addressed: pick.addressed };
}

/** Stage 2 calls this immediately after the NPC's reply lands so
 *  future moderator calls see the fresh room cooldown floor. Stamps
 *  on pick (not after stream) keeps a failed stream from refiring
 *  the picker on the very next message. */
export function markSpoke(channelId: string, _npcId: string): void {
  roomLastSpeak.set(channelId, Date.now());
}
