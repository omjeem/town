// Root landing.
//
//  • Signed in + has Town → redirect to /{slug}
//  • Signed in + no Town  → render onboarding (pick name → create Town)
//  • Not signed in        → guest playground (current TownGame as before)

import { redirect } from "next/navigation";

import { getSessionFromCookie } from "@/lib/session";
import { getTownByOwner } from "@/lib/town";
import { Onboarding } from "@/ui/Onboarding";
import { TownGame } from "@/ui/TownGame";

export default async function Home() {
  const session = await getSessionFromCookie();
  if (session) {
    const town = await getTownByOwner(session.user.id);
    if (town) redirect(`/${town.slug}`);
    return <Onboarding userName={session.user.name} />;
  }
  return <TownGame />;
}
