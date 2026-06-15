// Inbound event utilities for /api/events.
//
// Validation: `parseEnvelope` confirms the structural shape required to
// persist a TownEventRow — discriminant + ids + payload shape. Two event
// types are supported today: identity.created and memory.created.
//
// Security: `verifyHmac` uses a constant-time compare over the hex digest
// of sha256(secret, body). We compare hex strings of identical length so
// `timingSafeEqual` is happy.
//
// Idempotency: `isDuplicate` is a single keyed lookup on TownEventRow.id —
// the envelope's ULID is the dedupe key.

import crypto from "node:crypto";
import { prisma } from "@town/db";
import type {
  EventEnvelope,
  IdentityCreatedPayload,
  IdentitySource,
  MemoryCreatedPayload,
  TownEvent,
  TownEventType,
} from "@town/types";

const KNOWN_TYPES: ReadonlySet<TownEventType> = new Set<TownEventType>([
  "identity.created",
  "memory.created",
]);

const IDENTITY_SOURCES: ReadonlySet<IdentitySource> = new Set<IdentitySource>([
  "voice",
  "chat",
  "manual",
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

function asStringArray(o: Record<string, unknown>, key: string): string[] {
  const v = o[key];
  if (!Array.isArray(v) || !v.every((x) => typeof x === "string")) {
    throw new Error(`envelope.payload.${key} must be string[]`);
  }
  return v as string[];
}

function validatePayload(type: TownEventType, payload: unknown): void {
  if (!isObject(payload)) throw new Error("envelope.payload must be an object");

  switch (type) {
    case "identity.created": {
      asString(payload, "identityUuid");
      asString(payload, "fact");
      const src = payload.source;
      if (typeof src !== "string" || !IDENTITY_SOURCES.has(src as IdentitySource)) {
        throw new Error(
          `envelope.payload.source must be one of ${[...IDENTITY_SOURCES].join("|")}`,
        );
      }
      if (
        payload.confidence !== undefined &&
        (typeof payload.confidence !== "number" ||
          payload.confidence < 0 ||
          payload.confidence > 1)
      ) {
        throw new Error("envelope.payload.confidence must be number in [0,1]");
      }
      asString(payload, "validAt");
      return;
    }
    case "memory.created": {
      asString(payload, "memoryUuid");
      if (payload.title !== undefined && typeof payload.title !== "string") {
        throw new Error("envelope.payload.title must be string or omitted");
      }
      if (payload.summary !== undefined && typeof payload.summary !== "string") {
        throw new Error("envelope.payload.summary must be string or omitted");
      }
      asStringArray(payload, "topics");
      asString(payload, "createdAt");
      return;
    }
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

  // The casts below are safe because validatePayload narrowed the shape.
  const envelope = {
    id,
    userId,
    type: type as TownEventType,
    occurredAt,
    payload: raw.payload,
    version: 1 as const,
  };

  switch (type as TownEventType) {
    case "identity.created":
      return envelope as EventEnvelope<IdentityCreatedPayload> & {
        type: "identity.created";
      };
    case "memory.created":
      return envelope as EventEnvelope<MemoryCreatedPayload> & {
        type: "memory.created";
      };
  }
  // Unreachable — KNOWN_TYPES guard above.
  throw new Error(`unhandled envelope.type: ${type}`);
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
