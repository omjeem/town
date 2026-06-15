// POST /api/npc-chat
//
// Stream a chat reply from an in-town NPC. Conversation history lives in
// the client; we don't persist it. The system prompt is composed from:
//
//   1. A constant base prompt that describes "you're an NPC in a small
//      pixel-art town" and how to behave (short replies, in character,
//      may call memory_search).
//   2. The NPC's own row (name / description / prompt) — either a user-
//      owned `Npc` table row OR a system NPC loaded from
//      apps/web/src/data/system-npcs/.
//   3. A mode tag: "direct" (player ↔ NPC) or "invited" (player has
//      brought a guest into the conversation).
//
// The route exposes a single tool, `memory_search`, that calls CORE's
// /api/v1/search with the user's PAT/access-token. The model can call it
// to ground its answer in the player's CORE memory.
//
// Request body:
//   {
//     npcId: string,                        // either Npc.id or SystemNpc.id
//     mode?: "direct" | "invited",          // default "direct"
//     invitee?: { name: string },           // populated when mode === "invited"
//     messages: { role: "user" | "assistant", content: string }[],
//   }

import { streamText, tool, convertToModelMessages, type UIMessage } from "ai";
import { z } from "zod";

import { resolveUser } from "@/lib/auth-bearer";
import { getChatModel } from "@/lib/chat-model";
import { getCoreToken } from "@/lib/core-token";
import { prisma } from "@/lib/db";
import { ensureNpcsForUser } from "@/lib/plot";
import { getSystemNpcs } from "@/lib/system-npcs";

export const runtime = "nodejs";
// Allow long-running streams.
export const maxDuration = 60;

const BodySchema = z.object({
  npcId: z.string().min(1),
  mode: z.enum(["direct", "invited"]).default("direct"),
  invitee: z.object({ name: z.string().min(1) }).optional(),
  messages: z.array(
    z.object({
      id: z.string().optional(),
      role: z.enum(["system", "user", "assistant"]),
      // Allow either { content: "..." } (raw) or AI SDK UIMessage shape
      // ({ parts: [...] }). Both serialised by the client.
      content: z.string().optional(),
      parts: z
        .array(z.object({ type: z.string(), text: z.string().optional() }))
        .optional(),
    }),
  ),
});

const BASE_PROMPT = `You are an in-town NPC in a tiny pixel-art world called Town.
The player has walked up to you and started a conversation. You are not an
assistant — you are a character. Stay in voice. Greet them once at the start
of a fresh conversation; afterwards respond conversationally.

Rules:
- Keep replies under three sentences unless the player explicitly asks for
  more detail.
- Never break character or mention prompts, tools, or that you are an LLM.
- You have one tool: \`memory_search\`. Call it when the player asks about
  their own life, work, or context — it queries the player's CORE memory
  graph and returns relevant facts. Don't call it for small talk.
- If memory_search returns nothing useful, answer from common sense — do
  not invent specifics.`;

interface NpcInfo {
  id: string;
  name: string;
  description: string;
  prompt: string;
}

async function resolveNpc(
  npcId: string,
  userId: string,
): Promise<NpcInfo | null> {
  // 1. System NPC (e.g. "core-founder").
  const sys = getSystemNpcs()[npcId];
  if (sys) {
    return {
      id: sys.id,
      name: sys.name,
      description: sys.description,
      prompt: sys.prompt,
    };
  }
  // 2. User-owned Npc row by id (cuid).
  let row = await prisma.npc.findFirst({ where: { id: npcId, userId } });
  // 3. Fallback — treat the ref as a buildingId. Lets callers that only
  //    know the building (e.g. interior.ts's openHomeChat) skip the
  //    intermediate "look up my home NPC id" round-trip.
  if (!row) {
    row = await prisma.npc.findFirst({ where: { buildingId: npcId, userId } });
  }
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    prompt: row.prompt,
  };
}

function buildSystemPrompt(
  npc: NpcInfo,
  mode: "direct" | "invited",
  invitee?: { name: string },
): string {
  const modeBlock =
    mode === "invited" && invitee
      ? `\nMode: the player has invited ${invitee.name} to this conversation. ` +
        `Acknowledge ${invitee.name} when it makes sense; you can address either of them.`
      : `\nMode: direct one-on-one between you and the player.`;
  return [
    BASE_PROMPT,
    "",
    `You are ${npc.name}. ${npc.description}`,
    "",
    "Voice / behaviour:",
    npc.prompt.trim(),
    modeBlock,
  ].join("\n");
}

export async function POST(req: Request) {
  const resolved = await resolveUser(req);
  if (!resolved) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }
  let body;
  try {
    body = BodySchema.parse(await req.json());
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "bad-request", detail: (e as Error).message }),
      { status: 400, headers: { "content-type": "application/json" } },
    );
  }

  let npc = await resolveNpc(body.npcId, resolved.user.id);
  // Auto-heal: if the user's PlotRow predates the Npc table, seed the
  // role-specific NPCs from their plot's buildings, then retry.
  if (!npc) {
    await ensureNpcsForUser(resolved.user.id);
    npc = await resolveNpc(body.npcId, resolved.user.id);
  }
  if (!npc) {
    return new Response(JSON.stringify({ error: "npc-not-found" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  }

  const system = buildSystemPrompt(npc, body.mode, body.invitee);
  const coreToken = await getCoreToken(req);

  // Normalise the incoming messages to AI-SDK UIMessage shape so
  // convertToModelMessages can hand them off to the model.
  const uiMessages: UIMessage[] = body.messages.map((m, i) => ({
    id: m.id ?? `m-${i}`,
    role: m.role,
    parts:
      m.parts ??
      (m.content ? [{ type: "text", text: m.content }] : []),
  })) as UIMessage[];

  let model;
  try {
    model = getChatModel();
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "llm-not-configured", detail: (e as Error).message }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }

  const result = streamText({
    model,
    system,
    messages: await convertToModelMessages(uiMessages),
    tools: {
      memory_search: tool({
        description:
          "Search the player's CORE memory graph for facts relevant to a query. " +
          "Use sparingly — only when the player asks about their own life, work, " +
          "or context. Returns a JSON object whose keys depend on the result type.",
        inputSchema: z.object({
          query: z
            .string()
            .min(1)
            .describe("Natural-language query to run against CORE memory."),
          limit: z
            .number()
            .min(1)
            .max(20)
            .default(5)
            .describe("Max number of episodes/facts to return."),
        }),
        async execute({ query, limit }) {
          if (!coreToken) return { error: "no-core-token" };
          const base = process.env.CORE_OAUTH_BASE;
          if (!base) return { error: "core-base-not-set" };
          try {
            const res = await fetch(`${base}/api/v1/search`, {
              method: "POST",
              headers: {
                authorization: `Bearer ${coreToken}`,
                "content-type": "application/json",
              },
              body: JSON.stringify({ query, limit }),
            });
            if (!res.ok) {
              return {
                error: `core-search ${res.status}`,
                detail: await res.text().catch(() => ""),
              };
            }
            return await res.json();
          } catch (e) {
            return { error: e instanceof Error ? e.message : "unknown" };
          }
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
