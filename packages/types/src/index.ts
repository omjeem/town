// =============================================================================
// town-next shared types
//
// Scoped to the inbound-event log. CORE's webhook (POST /api/events) parses
// envelopes against these types and writes them as TownEventRow rows.
// Nothing downstream materialises them yet — the plot renderer reads from
// PlotRow directly (see @town/plot).
// =============================================================================

// -----------------------------------------------------------------------------
// Event envelope — CORE → town. Webhook receives JSON-encoded envelopes;
// validator parses by `type` discriminant.
// -----------------------------------------------------------------------------

// Town accepts exactly two event types from CORE. Both are append-only;
// town stores them as TownEventRow rows and the renderer reads them to
// react (NPC dialogue, decor, future plot mutations).
//
//   identity.created — a new identity fact landed. Today these come from
//                      voice transcription; the payload's `source` field
//                      lets future producers (chat, manual, etc.) ride
//                      the same channel.
//   memory.created   — a new memory document landed. Carries the topics
//                      it's about so town can light up the right surface
//                      without re-classifying.
export type TownEventType =
  | "identity.created"
  | "memory.created";

export type EventEnvelope<T = unknown> = {
  /** ULID. Idempotency key — town stores last seen and ignores duplicates. */
  id: string;
  /** Town-side User.id. CORE resolves this from its own user model before
   *  emitting; town does not do a lookup. */
  userId: string;
  type: TownEventType;
  /** ISO timestamp from CORE. */
  occurredAt: string;
  payload: T;
  /** Envelope schema version. v1 = 1. */
  version: 1;
};

// -----------------------------------------------------------------------------
// Event payloads
// -----------------------------------------------------------------------------

/** Source of the identity fact — extensible. Voice is the only producer
 *  today; "chat" / "manual" reserved for future surfaces. */
export type IdentitySource = "voice" | "chat" | "manual";

export type IdentityCreatedPayload = {
  /** CORE-side identifier — same as the aspect uuid that produced the fact
   *  for de-dup if CORE retries. */
  identityUuid: string;
  /** The identity fact, in the user's own words.
   *  e.g. "I prefer terse code review", "I'm a software engineer". */
  fact: string;
  /** Where the fact came from. "voice" is the day-one channel. */
  source: IdentitySource;
  /** Optional confidence score [0, 1] from CORE's extractor. Omit if
   *  unknown — town does not block on a missing value. */
  confidence?: number;
  /** When the fact became valid (CORE's clock). */
  validAt: string;
};

export type MemoryCreatedPayload = {
  /** CORE-side memory document id. Idempotency anchor. */
  memoryUuid: string;
  /** Optional title CORE picked for the document. */
  title?: string;
  /** Short summary (1-3 sentences). Optional — town only needs the topics
   *  to react; the summary is for UI surfaces that want to show context. */
  summary?: string;
  /** Topic labels the memory is about — used by town to pick which NPC
   *  reacts, which decor lights up, etc. Free-form strings; CORE picks
   *  from its own taxonomy. */
  topics: string[];
  /** When CORE finished writing the memory. */
  createdAt: string;
};

/** Discriminated union — narrow on `envelope.type`. */
export type TownEvent =
  | (EventEnvelope<IdentityCreatedPayload> & { type: "identity.created" })
  | (EventEnvelope<MemoryCreatedPayload> & { type: "memory.created" });
