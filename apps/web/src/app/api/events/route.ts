// POST /api/events — webhook receiver from CORE.
//
// Pipeline:
//   1. HMAC-verify the raw body against TOWN_WEBHOOK_SECRET → 401 on miss.
//   2. Parse the envelope structurally → 400 on miss.
//   3. Short-circuit on duplicate envelope id → 200 with duplicate=true.
//   4. Persist the raw TownEventRow as a write-only audit log.
//
// Errors past step 2 must not leak internals — log to stderr, return a
// generic 500. The client (CORE) will retry on a 500 and we'll dedupe via
// step 3 on the retry.

import { NextResponse, type NextRequest } from "next/server";
import { isDuplicate, parseEnvelope, verifyHmac } from "@/lib/town/events";
import { enqueueEventJob } from "@/lib/queue/events-queue";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const secret = process.env.TOWN_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[events] TOWN_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "server misconfigured" }, { status: 500 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-town-signature") ?? "";

  if (!verifyHmac(rawBody, signature, secret)) {
    return NextResponse.json({ error: "bad signature" }, { status: 401 });
  }

  let envelope;
  try {
    const json = JSON.parse(rawBody);
    envelope = parseEnvelope(json);
  } catch (e) {
    return NextResponse.json(
      { error: "bad request", detail: errMessage(e) },
      { status: 400 },
    );
  }

  try {
    if (await isDuplicate(envelope)) {
      return NextResponse.json({ ok: true, duplicate: true });
    }

    await prisma.townEventRow.create({
      data: {
        id: envelope.id,
        userId: envelope.userId,
        type: envelope.type,
        occurredAt: new Date(envelope.occurredAt),
        payload: envelope.payload as object,
      },
    });

    // Fan out to the worker. The row is durable on disk regardless, so
    // a Redis hiccup just means we miss the auto-mutation pass — an
    // operator can re-fan-out from TownEventRow later if needed.
    await enqueueEventJob(envelope.id);

    return NextResponse.json({ ok: true, id: envelope.id });
  } catch (e) {
    console.error("[events] failed to process envelope", envelope.id, e);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}

function errMessage(e: unknown): string {
  return e instanceof Error ? e.message : "unknown error";
}
