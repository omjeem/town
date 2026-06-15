// Conversation + Message helpers.
//
// All callers go through these so the (sorted aKey, bKey) invariant is
// honored in exactly one place, and pendingFromKey is updated atomically
// with each message insert.

import { prisma } from "./db";

export function sortParticipantKeys(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export async function findOrCreateConversation(
  townId: string,
  a: string,
  b: string,
) {
  const [aKey, bKey] = sortParticipantKeys(a, b);
  // upsert by the composite unique index.
  return prisma.conversation.upsert({
    where: { townId_aKey_bKey: { townId, aKey, bKey } },
    create: { townId, aKey, bKey },
    update: {},
  });
}

export async function listMessages(conversationId: string, limit = 200) {
  return prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    take: limit,
  });
}

export async function appendMessage(input: {
  conversationId: string;
  fromKey: string;
  text: string;
}) {
  // pendingFromKey always tracks the sender of the latest message —
  // simplest correct rule (see lib/conversation.ts comment in schema).
  const [msg] = await prisma.$transaction([
    prisma.message.create({
      data: {
        conversationId: input.conversationId,
        fromKey: input.fromKey,
        text: input.text,
      },
    }),
    prisma.conversation.update({
      where: { id: input.conversationId },
      data: {
        pendingFromKey: input.fromKey,
        lastMessageAt: new Date(),
      },
    }),
  ]);
  return msg;
}

// Conversations where the OTHER party sent the last message and the
// viewer hasn't replied. Drives the "💬 reply needed" pill above the
// remote player's head.
export async function listPendingForViewer(
  townId: string,
  viewerKey: string,
) {
  const rows = await prisma.conversation.findMany({
    where: {
      townId,
      OR: [{ aKey: viewerKey }, { bKey: viewerKey }],
      AND: [
        { pendingFromKey: { not: null } },
        { pendingFromKey: { not: viewerKey } },
      ],
    },
    select: {
      aKey: true,
      bKey: true,
      pendingFromKey: true,
      lastMessageAt: true,
    },
  });
  return rows.map((r) => ({
    otherKey: r.aKey === viewerKey ? r.bKey : r.aKey,
    pendingFromKey: r.pendingFromKey!,
    lastMessageAt: r.lastMessageAt,
  }));
}
