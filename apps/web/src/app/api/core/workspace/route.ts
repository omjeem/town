// GET /api/core/workspace
// Forwards to CORE's GET /api/v1/workspace. Returns the workspace the
// signed-in user is currently scoped to: { id, name, accentColor }.
// The town uses `name` as the HOME NPC's display name and `accentColor`
// to tint her dialogue + the future butler badge.

import { coreFetch } from "@/lib/coreClient";

export async function GET() {
  return coreFetch("/api/v1/workspace");
}
