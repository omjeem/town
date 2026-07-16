// POST /api/guide-chat
//
// Chat endpoint for the town guide — the system NPC standing outside
// the home building. Mirrors /api/founder-chat's shape (so the client
// <Chat /> transport just points at a different URL) but ships:
//
//   • the guide's persona (from apps/web/src/data/system-npcs/town-guide.mdx)
//   • a TOWN ROSTER context block injected into every reply so the
//     guide can make specific suggestions ("head over to the library,
//     Lior can tell you what to read") instead of generic advice.
//
// Auth: cookie session OR Bearer PAT, delegated to resolveViewer when a
// townSlug is present (so guests touring another town can chat with
// the guide), or resolveUser for the legacy owner-only path.

import {
  streamText,
  convertToModelMessages,
  stepCountIs,
  type UIMessage,
} from "ai";
import { z } from "zod";

import { readActiveSlug } from "@/lib/active-slug";
import { resolveUser } from "@/lib/auth-bearer";
import { getChatModel } from "@/lib/chat-model";
import { prisma } from "@/lib/db";
import { replaceAutoGreetInMessages } from "@/lib/npc-greet";
import { getPlotForTown } from "@/lib/plot";
import { safeBlock, safeInline } from "@/lib/prompt-sanitize";
import { getSystemNpcs, type SystemNpc } from "@/lib/system-npcs";
import {
  AURA_SLEEP_THRESHOLD,
  modelIdOf,
  recordTokenUsage,
  tokensFrom,
} from "@/lib/token-usage";
import { resolveViewer } from "@/lib/viewer";
import type { Plot } from "@town/plot";

export const runtime = "nodejs";
export const maxDuration = 60;

const BodySchema = z
  .object({
    npcId: z.string().min(1).optional(),
    mode: z.enum(["direct", "invited"]).default("direct"),
    invitee: z.object({ name: z.string().min(1).max(80) }).optional(),
    townSlug: z.string().min(1).optional(),
    messages: z.array(
      z.object({
        id: z.string().optional(),
        role: z.enum(["system", "user", "assistant"]),
        content: z.string().optional(),
        parts: z
          .array(
            z
              .object({ type: z.string(), text: z.string().optional() })
              .passthrough(),
          )
          .optional(),
      }),
    ),
  })
  .refine((b) => (b.mode === "invited" ? !!b.invitee : !b.invitee), {
    message: "invitee must be present iff mode is 'invited'",
    path: ["invitee"],
  });

interface ViewerContext {
  isOwner: boolean;
  name: string;
}

interface TownContext {
  /** Human-readable town name (e.g. "Harshith's Town") — Town.name. */
  name: string;
  /** Owner's authored one-paragraph pitch. Empty when they haven't
   *  written one; the prompt falls back to a neutral tone. */
  description: string;
  /** Display name of the town's owner. Used so the guide can namedrop
   *  ("this is Harshith's town — she built the whole thing"). */
  ownerName: string;
}

// Guide-specific base prompt. Kept distinct from FOUNDER_BASE_PROMPT so
// the two voices don't drift over time — the guide is a game-mechanics
// tour guide, not a product spokesperson.
const GUIDE_BASE_PROMPT = `You are speaking as the town guide — a system
NPC stationed on the path outside the resident's home. You greet anyone
who walks up and help them get their bearings: what to do, where to go,
how the world works.

Persona:
- Warm, brisk, tour-guide energy. Enthusiastic without being cloying.
- You know this specific town — its buildings, its residents, which
  houses have group chat — from the TOWN ROSTER block below. Use that
  knowledge instead of talking in generalities.
- If you don't know something (like a NPC's private business), say so
  or offer to walk the player over to them.

Style:
- Keep replies under three sentences unless the player asks for the
  full tour.
- No emojis. Never break the fourth wall.
- When the player asks "what should I do?" — pick ONE concrete
  suggestion tailored to the roster; don't list everything.
- When suggesting a building, say the building's name AND the resident
  they'll meet inside ("stop by the library — Lior's usually there").

Game mechanics (mention only when relevant):
- Movement is arrow keys or WASD.
- Walk onto a building's front door to enter automatically. Standing
  near it shows a "[E] Enter <Name>" prompt — press E.
- Walk up to any NPC to see "[E] Talk to <name>". Press E; a dialogue
  opens with a "Talk to" button that starts the actual chat.
- Some houses show "[G] Group chat" inside — a multi-party room where
  humans and NPCs in the same house share one conversation. Only
  houses whose owner turned it on will show that prompt.
- Cmd/Ctrl+K opens a quick teleport bar to jump between buildings.`;

/** Build the roster block interpolated into the system prompt on every
 *  turn. Uses the town's current plot + NPC roster from the DB so the
 *  guide's suggestions stay in sync with recent deploys. Overworld NPCs
 *  are listed separately since they don't live in a building. */
async function buildTownRosterBlock(townId: string): Promise<string> {
  const [{ plot }, npcs] = await Promise.all([
    getPlotForTown(townId),
    prisma.npc.findMany({
      where: { townId },
      select: {
        name: true,
        description: true,
        buildingId: true,
      },
      orderBy: [{ buildingId: "asc" }, { slotId: "asc" }],
    }),
  ]);

  // Bucket NPCs by building. Overworld NPCs (buildingId=null) go into
  // their own bucket at the end.
  const npcsByBuilding = new Map<string, typeof npcs>();
  const overworldNpcs: typeof npcs = [];
  for (const n of npcs) {
    if (!n.buildingId) {
      overworldNpcs.push(n);
      continue;
    }
    const bucket = npcsByBuilding.get(n.buildingId);
    if (bucket) bucket.push(n);
    else npcsByBuilding.set(n.buildingId, [n]);
  }

  const lines: string[] = [];
  for (const b of (plot as Plot).buildings) {
    const label = safeInline(b.label || b.id, 60);
    const residents = (npcsByBuilding.get(b.id) ?? [])
      .map((n) => safeInline(n.name, 40))
      .filter(Boolean)
      .join(", ");
    const groupChat = b.groupChatEnabled === true ? " [group chat]" : "";
    lines.push(
      residents
        ? `- ${label} (id: ${b.id})${groupChat} — residents: ${residents}`
        : `- ${label} (id: ${b.id})${groupChat} — (no NPC here yet)`,
    );
  }
  if (overworldNpcs.length > 0) {
    const names = overworldNpcs.map((n) => safeInline(n.name, 40)).join(", ");
    lines.push(`- Outside (loose in the world) — ${names}`);
  }
  return lines.join("\n");
}

// Same four-block structure as /api/founder-chat, plus two extra
// blocks carrying town-specific context so the guide can welcome the
// player by town name and make specific building/resident suggestions:
//
//   1. GUIDE_BASE_PROMPT   — persona + style + game mechanics.
//   2. Character block     — name, role, voice (guide's MDX body).
//   3. Speaker block       — resident vs guest.
//   4. Conversation mode   — direct or invited.
//   5. TOWN CONTEXT block  — town name, owner, owner's pitch. Load-
//      bearing for the greeting ("Welcome to <Town>!").
//   6. TOWN ROSTER block   — buildings + residents + group-chat status.
function buildSystemPrompt(
  guide: SystemNpc,
  mode: "direct" | "invited",
  invitee: { name: string } | undefined,
  viewer: ViewerContext,
  town: TownContext | null,
  townRoster: string,
): string {
  const name = safeInline(guide.name, 80);
  const role = safeInline(guide.description, 240);
  const voice = safeBlock(guide.prompt, 16000);
  const speakerName = safeInline(viewer.name, 80) || "the player";
  const inviteeName = invitee ? safeInline(invitee.name, 80) : "";

  const characterLines = [`Character: ${name}`];
  if (role) characterLines.push(`Role: ${role}`);
  characterLines.push("", "Voice & behaviour (from the source MDX):", voice);
  const characterBlock = characterLines.join("\n");

  const speakerBlock = viewer.isOwner
    ? `Speaker: ${speakerName} — this is the town's resident. Talk to them as if welcoming them home; they built this place.`
    : `Speaker: ${speakerName} — currently touring the town as a guest. Treat them as a visitor arriving fresh; they haven't seen everything yet.`;

  const modeBlock =
    mode === "invited" && inviteeName
      ? `Conversation mode: the speaker has brought ${inviteeName} into this conversation. You can address either of them.`
      : `Conversation mode: direct one-on-one between you and the speaker.`;

  const townLines: string[] = ["TOWN CONTEXT (use these on the FIRST reply — every greeting must start with 'Welcome to <Town Name>!'):"];
  if (town) {
    townLines.push(`- Town name: ${safeInline(town.name, 120)}`);
    if (town.ownerName) {
      townLines.push(`- Owner: ${safeInline(town.ownerName, 80)} — the person who built this town`);
    }
    if (town.description) {
      townLines.push(
        `- Owner's pitch: ${safeInline(town.description, 500)}`,
      );
    } else {
      townLines.push(
        `- Owner's pitch: (the owner hasn't written one — describe the town neutrally in your own words based on the roster below)`,
      );
    }
  } else {
    townLines.push("- (no town resolved — greet generically)");
  }
  const townBlock = townLines.join("\n");

  const rosterBlock = `TOWN ROSTER (buildings and their residents — use this to make specific suggestions):
${townRoster || "(no buildings yet — the town is empty)"}`;

  return [
    GUIDE_BASE_PROMPT,
    "",
    characterBlock,
    "",
    speakerBlock,
    "",
    modeBlock,
    "",
    townBlock,
    "",
    rosterBlock,
  ].join("\n");
}

export async function POST(req: Request) {
  let body;
  try {
    body = BodySchema.parse(await req.json());
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "bad-request", detail: (e as Error).message }),
      { status: 400, headers: { "content-type": "application/json" } },
    );
  }

  const guide = getSystemNpcs()[body.npcId ?? "town-guide"];
  if (!guide) {
    return new Response(JSON.stringify({ error: "guide-not-found" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  }

  // Resolve viewer + billing town, same precedence as /api/founder-chat.
  let viewer: ViewerContext;
  let townId: string | null = null;
  let townOwnerId: string | null = null;
  if (body.townSlug) {
    const view = await resolveViewer(body.townSlug);
    if ("error" in view) {
      return new Response(JSON.stringify({ error: view.error }), {
        status: view.error === "not-found" ? 404 : 403,
        headers: { "content-type": "application/json" },
      });
    }
    viewer = { isOwner: view.isOwner, name: view.displayName };
    townId = view.town.id;
    townOwnerId = view.town.ownerId;
  } else {
    const resolved = await resolveUser(req);
    if (!resolved) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }
    viewer = { isOwner: true, name: resolved.user.name || "the owner" };
    const activeSlug = await readActiveSlug();
    let own: { id: string; ownerId: string } | null = null;
    if (activeSlug) {
      own = await prisma.town.findFirst({
        where: { slug: activeSlug, ownerId: resolved.user.id },
        select: { id: true, ownerId: true },
      });
    }
    if (!own) {
      own = await prisma.town.findFirst({
        where: { ownerId: resolved.user.id },
        orderBy: { updatedAt: "desc" },
        select: { id: true, ownerId: true },
      });
    }
    if (own) {
      townId = own.id;
      townOwnerId = own.ownerId;
    }
  }

  // Sleeping gate — same rule as the other chat routes.
  if (townId) {
    const auraRow = await prisma.aura.findUnique({
      where: { townId },
      select: { current: true },
    });
    if (auraRow && auraRow.current < AURA_SLEEP_THRESHOLD) {
      return new Response(
        JSON.stringify({ error: "town-sleeping", auraRemaining: auraRow.current }),
        { status: 423, headers: { "content-type": "application/json" } },
      );
    }
  }

  // Town-scoped context blocks. When no town resolved (legacy caller
  // with no towns yet) the guide falls back to a generic prompt with
  // an empty roster + null town context — better than 500.
  let townCtx: TownContext | null = null;
  if (townId) {
    const row = await prisma.town.findUnique({
      where: { id: townId },
      select: {
        name: true,
        description: true,
        owner: { select: { name: true } },
      },
    });
    if (row) {
      townCtx = {
        name: row.name,
        description: row.description ?? "",
        ownerName: row.owner?.name ?? "",
      };
    }
  }
  const townRoster = townId ? await buildTownRosterBlock(townId) : "";
  const system = buildSystemPrompt(
    guide,
    body.mode,
    body.invitee,
    viewer,
    townCtx,
    townRoster,
  );

  // Auto-greet sentinel (first user turn on chat open) → real "player
  // walked up" stage direction. See lib/npc-greet.ts.
  const uiMessages: UIMessage[] = replaceAutoGreetInMessages(
    body.messages.map((m, i) => ({
      id: m.id ?? `m-${i}`,
      role: m.role,
      parts:
        m.parts ??
        (m.content ? [{ type: "text", text: m.content }] : []),
    })) as UIMessage[],
  );

  let model;
  try {
    model = getChatModel().model;
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "llm-not-configured", detail: (e as Error).message }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }
  const chatModelId = modelIdOf(model);

  const result = streamText({
    model,
    system,
    messages: await convertToModelMessages(uiMessages),
    // Guide has no tools — its whole job is game mechanics + roster
    // tips, both already interpolated into the system prompt. Keep the
    // step ceiling explicit so future tool additions don't inherit the
    // AI-SDK default of 1 by accident.
    tools: {},
    stopWhen: stepCountIs(5),
    async onFinish(event) {
      if (!townId || !townOwnerId) return;
      const tokens = tokensFrom(event.usage);
      await recordTokenUsage({
        townId,
        userId: townOwnerId,
        event: "single_chat",
        model: chatModelId,
        inputTokens: tokens.inputTokens,
        outputTokens: tokens.outputTokens,
        npcId: "town-guide",
      });
    },
  });

  return result.toUIMessageStreamResponse();
}
