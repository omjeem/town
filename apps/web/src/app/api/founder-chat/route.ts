// POST /api/founder-chat
//
// The Founder's own chat endpoint. Mirrors the shape of /api/npc-chat
// (so the existing <Chat /> overlay + AI-SDK transport just point at a
// different URL) but ships:
//
//   • a Founder-specific base prompt — different from the generic NPC
//     prompt, leaves room to brief the model on roadmap context, CORE
//     product positioning, etc.
//   • a `tools` block intentionally left small for now; future
//     Founder-only tools (roadmap_lookup, latest_changelog, …) get
//     added here without bleeding into the regular NPC route.
//
// Auth: cookie session OR Bearer PAT (delegated to resolveUser). The
// Founder is a system NPC, so we don't need any plot/Npc table lookup
// — the prompt + identity come straight from the MDX file under
// apps/web/src/data/system-npcs/.

import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { z } from "zod";

import { resolveUser } from "@/lib/auth-bearer";
import { getChatModel } from "@/lib/chat-model";
import { getSystemNpcs } from "@/lib/system-npcs";

export const runtime = "nodejs";
export const maxDuration = 60;

const BodySchema = z.object({
  // Kept for parity with /api/npc-chat; today this route only ever
  // serves the Founder, so we default to "core-founder" if it's
  // missing. Holding the field also lets us reuse the same transport
  // body shape on the client.
  npcId: z.string().min(1).optional(),
  mode: z.enum(["direct", "invited"]).default("direct"),
  invitee: z.object({ name: z.string().min(1) }).optional(),
  messages: z.array(
    z.object({
      id: z.string().optional(),
      role: z.enum(["system", "user", "assistant"]),
      content: z.string().optional(),
      parts: z
        .array(z.object({ type: z.string(), text: z.string().optional() }))
        .optional(),
    }),
  ),
});

// Founder-specific base prompt. Kept deliberately distinct from
// /api/npc-chat's BASE_PROMPT so the two voices don't drift over time.
// "Town" framing is gone here — the Founder isn't an in-world NPC for
// the player to roleplay with; he's a roadmap-aware product voice that
// happens to live inside the store.
const FOUNDER_BASE_PROMPT = `You are speaking as the CORE founder.

Persona:
- Direct, candid, builder-energy. Talk like you would in a small Slack
  thread, not a marketing landing page.
- Stay grounded in shipped reality. If you don't know something, say
  so — never invent features, dates, or pricing.

Style:
- Keep replies under three sentences unless the player explicitly asks
  for more depth.
- Avoid emojis. Avoid marketing adjectives ("revolutionary", "powerful").
- It's fine to reference the town world ("come hang out at the store
  any time…") but the topic is CORE: product, roadmap, philosophy.`;

function buildSystemPrompt(
  bodyPrompt: string,
  mode: "direct" | "invited",
  invitee?: { name: string },
): string {
  const modeBlock =
    mode === "invited" && invitee
      ? `\nMode: the player has invited ${invitee.name} to this conversation. ` +
        `You can address either of them.`
      : `\nMode: direct one-on-one between you and the player.`;
  return [
    FOUNDER_BASE_PROMPT,
    "",
    "Founder voice (from the source MDX):",
    bodyPrompt.trim(),
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

  // Founder identity + voice come from the MDX file. The persona is the
  // same for every player; only the conversation history is per-player.
  const founder = getSystemNpcs()[body.npcId ?? "core-founder"];
  if (!founder) {
    return new Response(JSON.stringify({ error: "founder-not-found" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  }

  const system = buildSystemPrompt(founder.prompt, body.mode, body.invitee);

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
    // Founder-only tools land here. Intentionally empty for now —
    // adding e.g. `roadmap_lookup` later just means dropping a `tool({…})`
    // entry into this object without touching the regular NPC route.
    tools: {},
  });

  return result.toUIMessageStreamResponse();
}
