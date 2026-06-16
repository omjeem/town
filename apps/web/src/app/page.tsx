// Root landing.
//
//  • Signed in + has Town → redirect to /{slug}
//  • Signed in + no Town  → render onboarding (pick name → create Town)
//  • Not signed in        → guest playground (current TownGame as before)

import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getSessionFromCookie } from "@/lib/session";
import { getTownByOwner } from "@/lib/town";
import { Onboarding } from "@/ui/Onboarding";
import { TownGame } from "@/ui/TownGame";

export const metadata: Metadata = {
  // Layout's template wraps the page title as "X · town"; leave the
  // default so the root tab reads "town" cleanly without the suffix.
  title: { absolute: "town" },
  description:
    "Welcome to town. Sign in with CORE to claim yours, or take the guest tour first.",
  openGraph: {
    title: "town",
    description:
      "Welcome to town. Sign in with CORE to claim yours, or take the guest tour first.",
  },
  twitter: {
    title: "town",
    description:
      "Welcome to town. Sign in with CORE to claim yours, or take the guest tour first.",
  },
};

export default async function Home() {
  const session = await getSessionFromCookie();
  if (session) {
    const town = await getTownByOwner(session.user.id);
    if (town) redirect(`/${town.slug}`);
    return <Onboarding userName={session.user.name} />;
  }
  return <TownGame />;
}
