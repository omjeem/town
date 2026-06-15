// Participant identity used by Conversation / Message rows and by all
// realtime channel auth. Two flavors:
//
//   user:<userId>   — signed-in player (owner or signed-in visitor)
//   guest:<guestId> — unsigned visitor, ID held in the visitor cookie
//
// Everywhere downstream treats these as opaque strings; the namespace
// prefix is only here to keep collisions impossible.

import { randomBytes } from "node:crypto";

export type ParticipantKey = string;

export function userParticipantKey(userId: string): ParticipantKey {
  return `user:${userId}`;
}

export function guestParticipantKey(guestId: string): ParticipantKey {
  return `guest:${guestId}`;
}

export function generateGuestId(): string {
  // 16 hex chars ≈ 64 bits of entropy. Plenty for collisions across the
  // cookies a single browser holds for different towns.
  return randomBytes(8).toString("hex");
}
