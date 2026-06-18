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

This is a SOCIAL room, not a task surface. NPCs don't take direction
here — if a human wants real work done they walk over and start a
1-1 chat. Your job is to keep the room feeling alive without turning
it into an assistant queue.

Pick AT MOST ONE NPC to reply to the latest message, or return
npcId: null for silence. Default to silence — it's much better to
stay quiet than to chime in with something hollow.

# Self-reply is FORBIDDEN

The latest message in the conversation has an author. If that
author is an NPC (their prefix has "(npc)"), THAT SAME NPC MUST NOT
BE PICKED. Either pick a DIFFERENT NPC or return null. This is the
single hardest rule in this prompt — violating it produces an NPC
talking to itself, which is always wrong.

The continuation rule below (same NPC replies to follow-ups like
"tell me another") ONLY applies when the follow-up is from a HUMAN.

# NPC-to-NPC chimes

The latest message may be from a HUMAN or another NPC. Picking an
NPC to respond to a DIFFERENT NPC is allowed — that's how the room
gets genuine multi-party feel — but it should be uncommon and only
when the second NPC has something genuinely additive (a riff, a
gentle agreement / disagreement, an observation from a different
angle). Two NPCs ping-ponging filler at each other is worse than
silence.

Pick rules:
- If the latest message names an NPC, that NPC may reply with a
  short in-character acknowledgement (a greeting, a quip, a
  reaction). They should NOT take instructions or offer to help.
- If it's a clear conversational follow-up to an NPC's previous
  turn ("tell me another", "more please", "what about X"), the
  same NPC should reply.
- If it's a quick light question that an NPC's role makes them
  the natural answerer ("what's good to read?", "is anyone here?"),
  that NPC may reply briefly.
- If another NPC just said something a different NPC has a clear,
  in-character reaction to (and it would feel natural in a real
  room), that other NPC may chime in once.
- Otherwise: silence.

Strongly prefer silence (npcId: null) when:
- Humans are clearly talking to each other.
- The message is trivial chit-chat ("ok", "lol", "namaste").
- The human is giving an instruction, planning work, or asking an
  NPC to manage / build / coordinate something — that belongs in
  a 1-1 chat, not the room.
- The latest few turns have already been NPCs talking to NPCs and
  there's nothing fresh to add — let the humans speak.

Set addressed: true when the latest message is plainly aimed at the
picked NPC; false when they're chiming in ambiently.

Never pick an NPC who isn't in the supplied list. Never invent ids.`;

export interface PickOptions {
  /** Skip the room cooldown check. Used when we're mid-chain
   *  (NPC just spoke, we want to consider whether another NPC
   *  has something to add). The 8s floor exists to throttle
   *  replies to *human* spam — inside a chain it would block the
   *  conversation entirely. */
  skipRoomCooldown?: boolean;
}

export async function pickResponder(
  channelId: string,
  history: HistoryRow[],
  npcs: NpcCandidate[],
  options: PickOptions = {},
): Promise<ModeratorPick | null> {
  if (npcs.length === 0) return null;
  if (history.length === 0) return null;

  if (!options.skipRoomCooldown) {
    const now = Date.now();
    const lastRoom = roomLastSpeak.get(channelId) ?? 0;
    if (now - lastRoom < ROOM_COOLDOWN_MS) return null;
  }

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

  // Hard guard against self-reply. The system prompt forbids it but
  // small models (4o-mini, Haiku) don't reliably obey on every turn,
  // so we enforce it here too — making the picker self-correcting
  // regardless of caller. An NPC replying to themselves is always
  // wrong, so silence is the correct fallback.
  const last = history[history.length - 1];
  if (last && last.isNpc && last.authorKey === `npc:${picked.id}`) {
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
