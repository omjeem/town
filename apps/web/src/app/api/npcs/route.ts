// /api/npcs — read + bulk-replace the signed-in user's NPC roster.
//
//   GET  /api/npcs                     → { npcs: Npc[] }
//   POST /api/npcs { npcs: Npc[] }     → { count }       (replaces wholesale)
//
// Both routes accept either a session cookie (browser) or a CORE PAT
// (Authorization: Bearer <pat>, used by the `town` CLI).

import { NextResponse } from "next/server";
import { z } from "zod";

import { resolveUser } from "@/lib/auth-bearer";
import { prisma } from "@/lib/db";

const NpcUpsertSchema = z.object({
  buildingId: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  prompt: z.string(),
  // Optional — when an existing row's id is included we preserve it,
  // otherwise a fresh cuid is generated.
  id: z.string().optional(),
});

const PostBodySchema = z.object({
  npcs: z.array(NpcUpsertSchema),
});

export async function GET(req: Request) {
  const resolved = await resolveUser(req);
  if (!resolved) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const rows = await prisma.npc.findMany({
    where: { userId: resolved.user.id },
    orderBy: { buildingId: "asc" },
  });
  return NextResponse.json({
    npcs: rows.map((r) => ({
      id: r.id,
      buildingId: r.buildingId,
      name: r.name,
      description: r.description,
      prompt: r.prompt,
    })),
  });
}

export async function POST(req: Request) {
  const resolved = await resolveUser(req);
  if (!resolved) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  let parsed;
  try {
    parsed = PostBodySchema.parse(await req.json());
  } catch (e) {
    return NextResponse.json(
      { error: "bad-request", detail: e instanceof Error ? e.message : "invalid body" },
      { status: 400 },
    );
  }

  // Replace wholesale inside a transaction so a partial write is impossible.
  // CLI `town deploy` will use this — the user's local .mdx files are the
  // source of truth and the server mirrors them on push.
  const userId = resolved.user.id;
  const count = await prisma.$transaction(async (tx) => {
    await tx.npc.deleteMany({ where: { userId } });
    if (parsed.npcs.length === 0) return 0;
    const created = await tx.npc.createMany({
      data: parsed.npcs.map((n) => ({
        ...(n.id ? { id: n.id } : {}),
        userId,
        buildingId: n.buildingId,
        name: n.name,
        description: n.description,
        prompt: n.prompt,
      })),
    });
    return created.count;
  });

  return NextResponse.json({ count });
}
