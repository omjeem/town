// Guest sign-in CTA dialogue. Owns the one "always-on" surface a
// signed-out visitor sees, regardless of which scene they're in.
//
// Why it lives here instead of inline in overworld-plot.ts:
//   • Both overworld-plot AND interior need to ensure it's open when the
//     visitor isn't signed in.
//   • interior.ts's onSceneLeave wipes the dialogue; it needs to look up
//     this key to know NOT to wipe it.
//   • Re-opening with ui.openDialogue always restarts the typewriter, so
//     callers go through openGuestCta() which short-circuits when the
//     dialogue is already this one.

import { ui } from "../ui/store";
import { theme } from "./theme";
import { startLogin } from "./auth";

export const GUEST_CTA_KEY = "plot-guest-cta";

export function openGuestCta(): void {
  if (ui.getState().dialogue?.key === GUEST_CTA_KEY) return;
  ui.openDialogue({
    key: GUEST_CTA_KEY,
    speaker: "World runner",
    accent: theme.buildings.HOME.accent,
    lines: [
      "Welcome, traveler. This is the shared preview town —",
      "seeded the same for every visitor. Sign in with CORE",
      "to claim your own plot and edit it from your row.",
    ],
    action: {
      label: "Sign in with CORE",
      onPress: () => {
        ui.closeDialogue();
        startLogin("/");
      },
    },
    // No "Just looking" secondary — the CTA is the only persistent UI a
    // guest sees, and we want it to stay on screen until they sign in.
  });
}
