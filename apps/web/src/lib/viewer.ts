// Resolve the viewer's participant identity for a given town slug.
// Used by every realtime / DM endpoint so the participant key is computed
// in one place (cookie shape + auth precedence in one helper).

import { cookies } from "next/headers";

import { guestParticipantKey, userParticipantKey } from "./participant";
import { getSessionFromCookie } from "./session";
import { getTownBySlug } from "./town";
import { parseVisitorCookie, visitorCookieName } from "./town-code";

export type ResolvedViewer = {
  // Centrifugo + Conversation rows both index on this.
  participantKey: string;
  displayName: string;
  // The town row we resolved against — caller usually wants this anyway.
  town: NonNullable<Awaited<ReturnType<typeof getTownBySlug>>>;
  isOwner: boolean;
};

export type ResolveError =
  | "not-found"
  | "forbidden";

export async function resolveViewer(
  slug: string,
): Promise<ResolvedViewer | { error: ResolveError }> {
  const town = await getTownBySlug(slug);
  if (!town) return { error: "not-found" };

  const session = await getSessionFromCookie();
  const isOwner = !!session && session.user.id === town.ownerId;
  if (isOwner && session) {
    return {
      participantKey: userParticipantKey(session.user.id),
      displayName: session.user.name,
      town,
      isOwner: true,
    };
  }

  const jar = await cookies();
  const visitor = parseVisitorCookie(jar.get(visitorCookieName(slug))?.value);
  if (!visitor || visitor.c !== town.shareCode) return { error: "forbidden" };

  if (session) {
    return {
      participantKey: userParticipantKey(session.user.id),
      displayName: session.user.name || visitor.n,
      town,
      isOwner: false,
    };
  }
  return {
    participantKey: guestParticipantKey(visitor.g),
    displayName: visitor.n,
    town,
    isOwner: false,
  };
}
