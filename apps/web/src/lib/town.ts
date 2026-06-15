// Town persistence helpers.
//
// One Town per user (Town.ownerId is unique). The slug is the URL segment
// (e.g. /harshith). The Town is created at onboarding — pickTown() is the
// single entry point that:
//   1. Normalizes + validates the slug,
//   2. Mints a share code,
//   3. Creates the Town,
//   4. Bootstraps the PlotRow (and links it to the Town) if the owner
//      doesn't have one yet, or links their existing PlotRow into the new
//      Town if they do.
//
// Errors surfaced to the API layer:
//   - "slug-taken"       — Town.slug @unique conflict.
//   - "slug-invalid"     — failed normalizeSlug + isValidSlug.
//   - "already-onboarded" — owner already has a Town.

import { catalog } from "@town/catalog";
import { generatePlot } from "@town/plot-gen";
import type { Manifest, Plot } from "@town/plot";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { prisma } from "./db";
import { OWNER_DEFAULT_CHARACTER } from "./characters";
import { seedNpcs } from "./plot";
import {
  generateShareCode,
  isValidSlug,
  normalizeSlug,
} from "./town-code";

let cachedManifest: Manifest | null = null;
function getManifest(): Manifest {
  if (cachedManifest) return cachedManifest;
  const path = resolve(
    process.cwd(),
    "public",
    "sprites",
    "extras",
    "MANIFEST.json",
  );
  cachedManifest = JSON.parse(readFileSync(path, "utf8")) as Manifest;
  return cachedManifest;
}

function bootstrapPlot(userId: string): Plot {
  return generatePlot({
    seed: userId,
    catalog,
    manifest: getManifest(),
    activeCount: 3,
    id: `plot-${userId}`,
  });
}

export type PickTownInput = {
  ownerId: string;
  // Display name for the town. The slug is derived from `name` unless
  // `slug` is provided explicitly. The display name is preserved verbatim.
  name: string;
  slug?: string;
};

export type TownRow = Awaited<ReturnType<typeof getTownByOwner>>;

export async function getTownByOwner(ownerId: string) {
  return prisma.town.findUnique({ where: { ownerId } });
}

export async function getTownBySlug(slug: string) {
  return prisma.town.findUnique({ where: { slug } });
}

export async function pickTown({ ownerId, name, slug: explicitSlug }: PickTownInput) {
  const existing = await getTownByOwner(ownerId);
  if (existing) {
    const err = new Error("already-onboarded") as Error & { code: string };
    err.code = "already-onboarded";
    throw err;
  }

  const slug = normalizeSlug(explicitSlug ?? name);
  if (!isValidSlug(slug)) {
    const err = new Error("slug-invalid") as Error & { code: string };
    err.code = "slug-invalid";
    throw err;
  }

  // Try a few share codes if we hit a collision. With 30 bits of entropy
  // collisions should be vanishingly rare; loop is a safety net.
  let town: Awaited<ReturnType<typeof prisma.town.create>> | null = null;
  let lastError: unknown = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const shareCode = generateShareCode();
    try {
      town = await prisma.town.create({
        data: {
          slug,
          name: name.trim(),
          ownerId,
          shareCode,
        },
      });
      break;
    } catch (e) {
      const code = (e as { code?: string }).code;
      // P2002 = unique constraint violation. If it's `slug`, surface
      // immediately so the user can pick a different one.
      if (code === "P2002") {
        const meta = (e as { meta?: { target?: string[] } }).meta;
        const target = meta?.target ?? [];
        if (target.includes("slug")) {
          const err = new Error("slug-taken") as Error & { code: string };
          err.code = "slug-taken";
          throw err;
        }
        // Otherwise it was shareCode — retry.
        lastError = e;
        continue;
      }
      throw e;
    }
  }
  if (!town) throw lastError ?? new Error("town-create-failed");

  // Owners default to the postman sprite. updateMany with `character: null`
  // means we won't clobber a future user-picked override.
  await prisma.user.updateMany({
    where: { id: ownerId, character: null },
    data: { character: OWNER_DEFAULT_CHARACTER },
  });

  // Link or create the PlotRow. Existing PlotRows keep their layout
  // (deterministic from userId seed, but visitor-curated edits are
  // preserved). New users get a fresh bootstrap.
  const existingPlot = await prisma.plotRow.findUnique({
    where: { userId: ownerId },
  });
  if (existingPlot) {
    await prisma.plotRow.update({
      where: { userId: ownerId },
      data: { townId: town.id },
    });
  } else {
    const plot = bootstrapPlot(ownerId);
    await prisma.plotRow.create({
      data: {
        userId: ownerId,
        townId: town.id,
        json: plot as unknown as object,
        version: 1,
      },
    });
    await seedNpcs(ownerId, plot);
  }

  return town;
}

export async function rotateShareCode(townId: string) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const shareCode = generateShareCode();
    try {
      return await prisma.town.update({
        where: { id: townId },
        data: { shareCode },
      });
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code === "P2002") continue;
      throw e;
    }
  }
  throw new Error("rotate-share-code-failed");
}
