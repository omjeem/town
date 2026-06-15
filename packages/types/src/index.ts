// =============================================================================
// town-next shared types
//
// Scoped to the inbound-event log. CORE's webhook (POST /api/events) parses
// envelopes against these types and writes them as TownEventRow rows.
// The events worker rehydrates them and converts each into PlotSuggestion
// rows for the player to approve/decline from the in-game sidebar.
// =============================================================================

// -----------------------------------------------------------------------------
// Event envelope — CORE → town.
// -----------------------------------------------------------------------------

// Town accepts two event types from CORE. Both fire from
// `graph-resolution.logic.ts` at the end of episode processing, after voice
// aspects have been resolved.
//
//   memory.added   — first time a session reaches town. Carries the full set
//                    of topics on the originating episode + any voice
//                    aspects extracted from it.
//   memory.updated — subsequent episodes in the same session. Carries the
//                    delta (topicsAdded) + any newly-resolved aspects.
export type TownEventType = "memory.added" | "memory.updated";

export type EventEnvelope<T = unknown> = {
  /** Stable unique id. Idempotency key — town dedupes on this. */
  id: string;
  /** CORE-side user id (the `sub` from /oauth/userinfo). Town looks up its
   *  own User row by `coreUserId` before doing anything else. */
  userId: string;
  type: TownEventType;
  /** ISO timestamp of when CORE finished resolving the episode. */
  occurredAt: string;
  payload: T;
  /** Envelope schema version. v1 = 1. */
  version: 1;
};

// -----------------------------------------------------------------------------
// Shared payload pieces
// -----------------------------------------------------------------------------

/** A label on the originating episode, enriched with how prevalent it is in
 *  the user's workspace and which other labels live nearby in embedding
 *  space. Town uses these signals to weight topic→building mapping decisions. */
export type Topic = {
  /** Stable CORE-side Label id. Useful for cross-event dedup. */
  id: string;
  /** Human-readable Label.name (e.g. "Studio Time"). */
  name: string;
  /** # of Document rows in the same workspace that reference this label. */
  count: number;
  /** Top similar labels in the same workspace by embedding cosine, capped at 10. */
  similar: TopicSibling[];
};

export type TopicSibling = {
  id: string;
  name: string;
  count: number;
  /** Cosine similarity score [0,1]. */
  score: number;
};

/** Voice aspect statements resolved during episode ingest, each as a
 *  free-form sentence in the user's own words (e.g. "I prefer terse code
 *  review"). Town's curator absorbs the most relevant statement into the
 *  HOME NPC's description when the NPC still carries its seed copy. */
export type IdentityAspect = string;

// -----------------------------------------------------------------------------
// Event payloads
// -----------------------------------------------------------------------------

export type MemoryAddedPayload = {
  /** CORE sessionId — stable across `memory.added` + future `memory.updated`. */
  memoryUuid: string;
  /** Latest Document.content for the session, or "" if compaction hasn't
   *  produced one yet (compaction runs in parallel with ingest). */
  summary: string;
  /** Full set of topics on this originating episode. */
  topics: Topic[];
  /** Voice aspects resolved on this episode. */
  identityAspects: IdentityAspect[];
};

export type MemoryUpdatedPayload = {
  memoryUuid: string;
  summary: string;
  /** Topics on this new episode — delta from town's perspective. */
  topicsAdded: Topic[];
  identityAspects: IdentityAspect[];
};

/** Discriminated union — narrow on `envelope.type`. */
export type TownEvent =
  | (EventEnvelope<MemoryAddedPayload> & { type: "memory.added" })
  | (EventEnvelope<MemoryUpdatedPayload> & { type: "memory.updated" });
