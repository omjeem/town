// Generic "walk up → say hi → offer to chat" flow shared by every NPC
// (interior slots + overworld residents). The dialogue surface says
// "Hi, I'm {name}. {description}" with a [Talk to {name}] action that
// hands off to <Chat /> via ui.openChat(). Extracted from interior.ts
// so the overworld scene can trigger the same flow without duplicating
// the guest-CTA branch.

import { getSession, startLogin } from "./auth";
import { getViewerTownSlug } from "./plotClient";
import { ui } from "../ui/store";

export interface NpcGreetingOpts {
  /** npcId for the chat endpoint — the Npc DB row's id, a system NPC
   *  id, or a buildingId when calling the demo fallback. */
  npcId: string;
  name: string;
  description: string;
  accent: string;
  /** Override the chat API URL. Defaults to /api/npc-chat. The Founder
   *  uses /api/founder-chat for its own prompt + tools. */
  chatApi?: string;
}

export function openNpcGreeting(opts: NpcGreetingOpts): void {
  // Guests (validated visit cookie) can talk to NPCs without a CORE
  // session — the server scopes memory_search to the town owner's
  // memory, and the owner's authored NPC prompt is what controls how
  // much is disclosed. Only truly anonymous viewers (no session AND
  // not touring anyone's town) hit the sign-in CTA.
  if (!getSession() && !getViewerTownSlug()) {
    ui.openDialogue({
      key: `npc-${opts.npcId}-unsigned`,
      speaker: opts.name,
      accent: opts.accent,
      lines: [
        `Hi, I'm ${opts.name}.`,
        opts.description,
        "But the world only remembers folks who've signed the ledger.",
      ],
      action: {
        label: "Sign in with CORE",
        onPress: () => {
          ui.closeDialogue();
          startLogin("/");
        },
      },
      secondary: {
        label: "Not now",
        onPress: () => ui.closeDialogue(),
      },
    });
    return;
  }
  ui.openDialogue({
    key: `npc-${opts.npcId}-greet`,
    speaker: opts.name,
    accent: opts.accent,
    lines: [`Hi, I'm ${opts.name}.`, opts.description],
    action: {
      label: `Talk to ${opts.name}`,
      onPress: () =>
        ui.openChat({
          npcId: opts.npcId,
          speaker: opts.name,
          description: opts.description,
          accent: opts.accent,
          mode: "direct",
          ...(opts.chatApi ? { chatApi: opts.chatApi } : {}),
        }),
    },
    secondary: {
      label: "Not now",
      onPress: () => ui.closeDialogue(),
    },
  });
}
