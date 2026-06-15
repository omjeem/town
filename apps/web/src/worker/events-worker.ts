// BullMQ worker that consumes /town-events jobs.
//
// Two ways to run it:
//
//   1. Inline with Next — instrumentation.ts calls startEventsWorker() on
//      server startup. Easiest for dev + small deploys. Set
//      DISABLE_IN_PROCESS_WORKER=1 to opt out (e.g. on serverless).
//
//   2. Standalone — `pnpm --filter @town/web worker` runs this file
//      directly. Use this when you want to scale the worker fleet
//      independently of the HTTP server.
//
// Both paths share the same `startEventsWorker` so behaviour is identical.

import { Worker, type Job } from "bullmq";

import { prisma } from "../lib/db";
import { decide, type NpcRowLite } from "../lib/town/decide";
import { applyEffects } from "../lib/town/apply-effects";
import {
  EVENTS_QUEUE_NAME,
  type EventJobData,
} from "../lib/queue/events-queue";
import { getRedisConnection } from "../lib/queue/redis";
import type { Plot } from "@town/plot";
import type { TownEvent, TownEventType } from "@town/types";

async function processJob(job: Job<EventJobData>): Promise<void> {
  const eventId = job.data.eventId;
  const row = await prisma.townEventRow.findUnique({
    where: { id: eventId },
  });
  if (!row) {
    // Row got nuked between enqueue and consume — nothing to act on.
    return;
  }

  // Rehydrate the loose DB row into the discriminated TownEvent shape.
  // parseEnvelope already validated the payload at write time, so trust
  // it now.
  const envelope = {
    id: row.id,
    userId: row.userId,
    type: row.type as TownEventType,
    occurredAt: row.occurredAt.toISOString(),
    payload: row.payload,
    version: 1 as const,
  } as TownEvent;

  const plotRow = await prisma.plotRow.findUnique({
    where: { userId: row.userId },
  });
  if (!plotRow) {
    console.warn(
      `[worker] user ${row.userId} has no plot row; skipping event ${eventId}`,
    );
    await markProcessed(eventId);
    return;
  }
  const npcs: NpcRowLite[] = await prisma.npc.findMany({
    where: { userId: row.userId },
    select: { id: true, buildingId: true, name: true, description: true, prompt: true },
  });

  const effects = decide(envelope, {
    plot: plotRow.json as unknown as Plot,
    npcs,
  });

  if (effects.length === 0) {
    console.log(`[worker] ${eventId} ${envelope.type} - no effects`);
    await markProcessed(eventId);
    return;
  }

  const result = await applyEffects(row.userId, effects);
  console.log(
    `[worker] ${eventId} ${envelope.type} buildings+${result.buildingsAdded} npcs~${result.npcsTweaked}`,
  );
  await markProcessed(eventId);
}

async function markProcessed(eventId: string): Promise<void> {
  await prisma.townEventRow.update({
    where: { id: eventId },
    data: { processedAt: new Date() },
  });
}

export interface StartedWorker {
  worker: Worker<EventJobData>;
  stop: () => Promise<void>;
}

// Module-level singleton so HMR re-imports don't spin up duplicate
// workers (Next dev reloads instrumentation.ts on changes). Also
// declared on globalThis so a server-bundle split that loads this
// module twice still shares state.
declare global {
  // eslint-disable-next-line no-var
  var __TOWN_EVENTS_WORKER__: StartedWorker | undefined;
}

export function startEventsWorker(): StartedWorker {
  if (globalThis.__TOWN_EVENTS_WORKER__) {
    return globalThis.__TOWN_EVENTS_WORKER__;
  }

  const concurrency = Number.parseInt(
    process.env.EVENTS_WORKER_CONCURRENCY ?? "4",
    10,
  );

  console.log(
    `[worker] starting on queue=${EVENTS_QUEUE_NAME} concurrency=${concurrency}`,
  );

  const worker = new Worker<EventJobData>(EVENTS_QUEUE_NAME, processJob, {
    connection: getRedisConnection(),
    concurrency,
  });

  worker.on("failed", (job, err) => {
    console.error(
      `[worker] job ${job?.id ?? "?"} failed (attempt ${job?.attemptsMade ?? "?"}): ${err.message}`,
    );
  });

  const stop = async (): Promise<void> => {
    await worker.close();
    globalThis.__TOWN_EVENTS_WORKER__ = undefined;
  };

  const started: StartedWorker = { worker, stop };
  globalThis.__TOWN_EVENTS_WORKER__ = started;
  return started;
}

// Standalone entry point — only fires when this file is executed
// directly (e.g. `tsx src/worker/events-worker.ts`). Behind a check on
// `process.argv[1]` so importing the module (instrumentation.ts) does
// NOT also install signal handlers.
import { fileURLToPath } from "node:url";

const isMain =
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isMain) {
  const { stop } = startEventsWorker();
  const shutdown = async (signal: string): Promise<void> => {
    console.log(`[worker] ${signal} - draining`);
    await stop();
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}
