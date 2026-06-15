// BullMQ connection helper. We hand BullMQ the connection URL (parsed
// into a connection options object) instead of constructing a Redis
// client ourselves — that way BullMQ uses its own pinned ioredis
// version and we sidestep type mismatches between the BullMQ peer and
// any other ioredis instance in node_modules.
//
// BullMQ requires `maxRetriesPerRequest: null` on Worker connections,
// so we set it here for every consumer.

import type { ConnectionOptions } from "bullmq";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

function parse(url: string): { host: string; port: number; password?: string; username?: string; db?: number } {
  const parsed = new URL(url);
  return {
    host: parsed.hostname || "localhost",
    port: parsed.port ? Number.parseInt(parsed.port, 10) : 6379,
    ...(parsed.username ? { username: decodeURIComponent(parsed.username) } : {}),
    ...(parsed.password ? { password: decodeURIComponent(parsed.password) } : {}),
    ...(parsed.pathname && parsed.pathname.length > 1
      ? { db: Number.parseInt(parsed.pathname.slice(1), 10) || 0 }
      : {}),
  };
}

export function getRedisConnection(): ConnectionOptions {
  return {
    ...parse(REDIS_URL),
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  };
}
