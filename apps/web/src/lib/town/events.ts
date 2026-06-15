// Inbound event utilities for /api/events.
//
// Validation: `parseEnvelope` confirms the structural shape required to
// persist a TownEventRow — discriminant + ids + payload shape. Two event
// types are supported today: memory.added and memory.updated.
//
// Security: `verifyHmac` uses a constant-time compare over the hex digest
// of sha256(secret, body). We compare hex strings of identical length so
// `timingSafeEqual` is happy.
//
// Idempotency: `isDuplicate` is a single keyed lookup on TownEventRow.id —
// the envelope id is the dedupe key.

import crypto from "node:crypto";
import { prisma } from "@town/db";
import type {
  EventEnvelope,
  MemoryAddedPayload,
  MemoryUpdatedPayload,
  Topic,
  TopicSibling,
  TownEvent,
  TownEventType,
} from "@town/types";

const KNOWN_TYPES: ReadonlySet<TownEventType> = new Set<TownEventType>([
  "memory.added",
  "memory.updated",
]);

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(o: Record<string, unknown>, key: string): string {
  const v = o[key];
  if (typeof v !== "string" || v.length === 0) {
    throw new Error(`envelope.${key} must be a non-empty string`);
  }
  return v;
}

function asNonEmptyArray(o: Record<string, unknown>, key: string): unknown[] {
  const v = o[key];
  if (!Array.isArray(v)) {
    throw new Error(`envelope.payload.${key} must be an array`);
  }
  return v;
}

function asNumber(o: Record<string, unknown>, key: string): number {
  const v = o[key];
  if (typeof v !== "number" || !Number.isFinite(v)) {
    throw new Error(`${key} must be a finite number`);
  }
  return v;
}

function validateTopicSibling(raw: unknown, path: string): TopicSibling {
  if (!isObject(raw)) throw new Error(`${path} must be an object`);
  return {
    id: asString(raw, "id"),
    name: asString(raw, "name"),
    count: asNumber(raw, "count"),
    score: asNumber(raw, "score"),
  };
}

function validateTopic(raw: unknown, path: string): Topic {
  if (!isObject(raw)) throw new Error(`${path} must be an object`);
  const similar = raw.similar;
  if (!Array.isArray(similar)) {
    throw new Error(`${path}.similar must be an array`);
  }
  return {
    id: asString(raw, "id"),
    name: asString(raw, "name"),
    count: asNumber(raw, "count"),
    similar: similar.map((s, i) =>
      validateTopicSibling(s, `${path}.similar[${i}]`),
    ),
  };
}

function validateIdentityAspects(raw: unknown, path: string): string[] {
  if (!Array.isArray(raw)) {
    throw new Error(`${path} must be an array of strings`);
  }
  return raw.map((v, i) => {
    if (typeof v !== "string" || v.length === 0) {
      throw new Error(`${path}[${i}] must be a non-empty string`);
    }
    return v;
  });
}

function validatePayload(type: TownEventType, payload: unknown): void {
  if (!isObject(payload)) throw new Error("envelope.payload must be an object");

  asString(payload, "memoryUuid");
  if (typeof payload.summary !== "string") {
    throw new Error("envelope.payload.summary must be a string");
  }
  validateIdentityAspects(
    payload.identityAspects,
    "envelope.payload.identityAspects",
  );

  if (type === "memory.added") {
    const topics = asNonEmptyArray(payload, "topics");
    topics.forEach((t, i) =>
      validateTopic(t, `envelope.payload.topics[${i}]`),
    );
  } else {
    const topicsAdded = asNonEmptyArray(payload, "topicsAdded");
    topicsAdded.forEach((t, i) =>
      validateTopic(t, `envelope.payload.topicsAdded[${i}]`),
    );
  }
}

/**
 * Parse + structurally validate an inbound envelope. Throws on malformed
 * input — caller maps the throw to HTTP 400.
 */
export function parseEnvelope(raw: unknown): TownEvent {
  if (!isObject(raw)) throw new Error("envelope must be an object");

  const id = asString(raw, "id");
  const userId = asString(raw, "userId");
  const type = asString(raw, "type");
  const occurredAt = asString(raw, "occurredAt");

  if (!KNOWN_TYPES.has(type as TownEventType)) {
    throw new Error(`unknown envelope.type: ${type}`);
  }
  if (raw.version !== 1) {
    throw new Error("envelope.version must be 1");
  }
  if (Number.isNaN(Date.parse(occurredAt))) {
    throw new Error("envelope.occurredAt must be ISO timestamp");
  }

  validatePayload(type as TownEventType, raw.payload);

  const envelope = {
    id,
    userId,
    type: type as TownEventType,
    occurredAt,
    payload: raw.payload,
    version: 1 as const,
  };

  if (type === "memory.added") {
    return envelope as EventEnvelope<MemoryAddedPayload> & {
      type: "memory.added";
    };
  }
  return envelope as EventEnvelope<MemoryUpdatedPayload> & {
    type: "memory.updated";
  };
}

/**
 * Compute the HMAC the webhook sender should put in the
 * `x-town-signature` header. Hex-encoded sha256.
 */
export function signBody(secret: string, rawBody: string): string {
  return crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
}

export function verifyHmac(
  rawBody: string,
  signature: string,
  secret: string,
): boolean {
  if (!signature) return false;
  const expected = signBody(secret, rawBody);
  if (expected.length !== signature.length) return false;
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(signature, "hex"),
    );
  } catch {
    return false;
  }
}

/** O(1) idempotency check on TownEventRow.id. */
export async function isDuplicate(envelope: TownEvent): Promise<boolean> {
  const row = await prisma.townEventRow.findUnique({
    where: { id: envelope.id },
    select: { id: true },
  });
  return row !== null;
}
