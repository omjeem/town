// /{town_slug} — the named town view.
//
//  • Owner   → full TownGame.
//  • Visitor with valid visit cookie → read-only TownGame.
//  • Anyone else → <VisitorGate> (name + share code).
//
// Slug is server-resolved against Town.slug. 404 if no such town. The
// owner check is by Session.userId === Town.ownerId.

import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { OWNER_DEFAULT_CHARACTER } from "@/lib/characters";
import { prisma } from "@/lib/db";
import { getSessionFromCookie } from "@/lib/session";
import { getTownBySlug } from "@/lib/town";
import { parseVisitorCookie, visitorCookieName } from "@/lib/town-code";
import { TownGame } from "@/ui/TownGame";
import { VisitorGate } from "@/ui/VisitorGate";

export default async function TownPage({
  params,
}: {
  params: Promise<{ town: string }>;
}) {
  const { town: slug } = await params;
  const town = await getTownBySlug(slug);
  if (!town) notFound();

  const session = await getSessionFromCookie();
  const isOwner = !!session && session.user.id === town.ownerId;

  if (isOwner) {
    const owner = await prisma.user.findUnique({
      where: { id: town.ownerId },
      select: { character: true },
    });
    return (
      <TownGame
        ownerCharacter={owner?.character ?? OWNER_DEFAULT_CHARACTER}
        townSlug={town.slug}
      />
    );
  }

  const jar = await cookies();
  const visitor = parseVisitorCookie(jar.get(visitorCookieName(slug))?.value);
  // The cookie carries the code the visitor used at entry — if the owner
  // has rotated since, treat the cookie as expired and re-render the gate.
  if (visitor && visitor.c === town.shareCode) {
    return (
      <TownGame
        viewerMode="visitor"
        townSlug={town.slug}
        townName={town.name}
        visitorName={visitor.n}
        visitorCharacter={visitor.ch}
      />
    );
  }

  return (
    <VisitorGate
      townName={town.name}
      townSlug={town.slug}
      initialName={session?.user.name}
      signedIn={!!session}
    />
  );
}
