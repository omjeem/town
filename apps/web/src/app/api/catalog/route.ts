// /api/catalog — public read of the catalog (plots + variants + interior
// shells). Single source of truth lives in `@town/catalog`'s catalog.json;
// this route serves it so the static catalog browser at
// /sprites/catalog/index.html and any external agent can fetch it without
// the repo carrying a second copy.

import { NextResponse } from "next/server";
import { catalog } from "@town/catalog";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(catalog, {
    // Catalog is rebuilt with the app — let CDNs/browsers cache for a
    // minute. Refresh via a hard reload while editing.
    headers: { "cache-control": "public, max-age=60" },
  });
}
