// BullMQ queue used to fan out inbound CORE events into background work.
// The /api/events route enqueues one job per persisted TownEventRow; the
// worker (src/worker/events-worker.ts) consumes them and runs the decide
// → applyEffects pipeline.
//
// The job payload is the envelope's id — small, idempotent, and the
// worker re-fetches the full row from Postgres so we don't store anything
// stale in Redis. If Redis is unreachable when the API route fires the
// enqueue we swallow the error and log; the event is already on disk,
// and a future operator action can re-fan-out from TownEventRow.

import { Queue } from "bullmq";
import { getRedisConnection } from "./redis";

export const EVENTS_QUEUE_NAME = "town-events";

export type EventJobData = {
  /** TownEventRow.id — same as the envelope's ULID. */
  eventId: string;
};

// Lazily constructed singleton. `let | null` instead of typed-eagerly so
// `getQueue()` narrows after the assignment without an unsafe non-null.
let _queue: Queue<EventJobData> | undefined;

function getQueue(): Queue<EventJobData> {
  if (_queue) return _queue;
  const q = new Queue<EventJobData>(EVENTS_QUEUE_NAME, {
    connection: getRedisConnection(),
    defaultJobOptions: {
      attempts: 5,
      backoff: { type: "exponential", delay: 2000 },
      removeOnComplete: { age: 24 * 60 * 60, count: 1000 },
      removeOnFail: { age: 7 * 24 * 60 * 60 },
    },
  });
  _queue = q;
  return q;
}

/** Enqueue a job to process an already-persisted TownEventRow. Uses the
 *  event id as the jobId so a retried CORE webhook can't queue duplicate
 *  jobs for the same event. */
export async function enqueueEventJob(eventId: string): Promise<void> {
  try {
    await getQueue().add(
      "process",
      { eventId },
      { jobId: eventId },
    );
  } catch (err) {
    console.error("[events-queue] enqueue failed", eventId, err);
  }
}
