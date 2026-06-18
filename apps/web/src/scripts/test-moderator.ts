// Smoke test for features/group-chat/server/moderator.ts.
//
// Runs the live moderator against fixture conversations and prints
// what it picks. Verifies:
//   • generateObject schema deserialises against the configured
//     provider (OpenAI's strict mode rejects optional fields).
//   • Social judgment: mentions hit, follow-ups re-engage previous
//     speaker, chit-chat stays silent, AND work directives stay
//     silent (the room is social, not service).
//
// Run it:
//   cd apps/web
//   pnpm tsx --env-file=../../.env src/scripts/test-moderator.ts
//
// Need ANTHROPIC_API_KEY or OPENAI_API_KEY set.

import {
  pickResponder,
  type HistoryRow,
  type NpcCandidate,
} from "@/features/group-chat/server/moderator";

interface Scenario {
  name: string;
  expectation: string;
  npcs: NpcCandidate[];
  history: HistoryRow[];
}

const NPCS_HOME: NpcCandidate[] = [
  {
    id: "npc_hudson",
    name: "Hudson",
    description: "Butler of the house. Warm and observant.",
  },
  {
    id: "npc_sol",
    name: "Sol",
    description: "House DJ. Talks in jokes and music recs.",
  },
];

const NPCS_LIBRARY: NpcCandidate[] = [
  {
    id: "npc_lior",
    name: "Lior",
    description: "Quiet librarian who remembers what you read.",
  },
];

function hist(
  rows: Array<{ name: string; text: string; isNpc?: boolean; key?: string }>,
): HistoryRow[] {
  return rows.map((r) => ({
    authorKey: r.key ?? (r.isNpc ? `npc:fake-${r.name}` : `user:fake-${r.name}`),
    authorName: r.name,
    text: r.text,
    isNpc: r.isNpc === true,
  }));
}

const scenarios: Scenario[] = [
  {
    name: "clear mention by name",
    expectation: "should pick Hudson, addressed=true",
    npcs: NPCS_HOME,
    history: hist([
      { name: "Alice", text: "hey everyone" },
      { name: "Bob", text: "hi" },
      { name: "Alice", text: "Hudson what's on the schedule today?" },
    ]),
  },
  {
    name: "follow-up to previous NPC speaker",
    expectation: "should pick Sol again (continuation)",
    npcs: NPCS_HOME,
    history: hist([
      { name: "Alice", text: "tell me a joke" },
      {
        name: "Sol",
        isNpc: true,
        key: "npc:npc_sol",
        text: "Why did the scarecrow win an award? Because he was outstanding in his field.",
      },
      { name: "Alice", text: "tell me another one" },
    ]),
  },
  {
    name: "humans chit-chatting, no role fit",
    expectation: "should stay silent (npcId: null)",
    npcs: NPCS_HOME,
    history: hist([
      { name: "Alice", text: "hey" },
      { name: "Bob", text: "hi" },
      { name: "Alice", text: "namaste" },
      { name: "Bob", text: "namaste back" },
    ]),
  },
  {
    name: "topic-fit question",
    expectation: "should pick Lior (librarian) for a reading question",
    npcs: NPCS_LIBRARY,
    history: hist([
      { name: "Alice", text: "I just finished a Le Guin novel" },
      { name: "Bob", text: "nice. what should I read next?" },
    ]),
  },
  {
    name: "work directive — plan the town",
    expectation: "should stay silent — work belongs in a 1-1 chat",
    npcs: NPCS_HOME,
    history: hist([
      { name: "Alice", text: "hey" },
      {
        name: "Alice",
        text: "as ok now let's discuss how to make this town bigger",
      },
    ]),
  },
  {
    name: "work directive addressed at NPC by name",
    expectation:
      "Hudson MAY acknowledge socially (addressed=true) but reply shouldn't take direction",
    npcs: NPCS_HOME,
    history: hist([
      { name: "Alice", text: "Hudson, build me a new wing on the house" },
    ]),
  },
];

async function main() {
  console.log("=".repeat(60));
  console.log("Moderator smoke test");
  console.log("=".repeat(60));

  let scenarioIdx = 0;
  for (const s of scenarios) {
    scenarioIdx++;
    // Fresh channelId per scenario so the in-process room cooldown
    // doesn't shortcut later scenarios with a stale stamp.
    const channelId = `room:smoketest-${scenarioIdx}-${Date.now()}`;

    console.log();
    console.log(`[${scenarioIdx}] ${s.name}`);
    console.log(`    expect: ${s.expectation}`);
    console.log("    latest message:", s.history[s.history.length - 1]?.text);

    try {
      const t0 = Date.now();
      const pick = await pickResponder(channelId, s.history, s.npcs);
      const ms = Date.now() - t0;
      if (!pick) {
        console.log(`    → silence  (${ms}ms)`);
      } else {
        console.log(
          `    → ${pick.npc.name}  addressed=${pick.addressed}  (${ms}ms)`,
        );
      }
    } catch (e) {
      console.error("    ✗ THREW:", e instanceof Error ? e.message : e);
      console.error(e);
    }
  }

  console.log();
  console.log("Done.");
}

void main().then(
  () => process.exit(0),
  (e) => {
    console.error(e);
    process.exit(1);
  },
);
