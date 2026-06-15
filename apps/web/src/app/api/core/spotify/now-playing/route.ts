// GET /api/core/spotify/now-playing
// Surfaces the currently playing Spotify track for the signed-in user,
// going through CORE's integration_account action endpoint so we never
// touch Spotify credentials directly.
//
// Shape:
//   { connected: false }
//   { connected: true, playing: false }
//   { connected: true, playing: true, track: { ... } }

import { coreFetch } from "@/lib/coreClient";

type Account = {
  id: string;
  integrationDefinition?: { slug?: string | null; name?: string | null } | null;
};

type ActionEnvelope = {
  result?: {
    content?: Array<{ text?: string }>;
    isError?: boolean;
  };
};

type SpotifyCurrentlyPlaying = {
  is_playing?: boolean;
  progress_ms?: number;
  item?: {
    name?: string;
    duration_ms?: number;
    external_urls?: { spotify?: string };
    artists?: Array<{ name?: string }>;
    album?: {
      name?: string;
      images?: Array<{ url?: string; width?: number; height?: number }>;
    };
  } | null;
};

const TAG = "[spotify/now-playing]";

function notPlaying(connected: boolean) {
  return Response.json({ connected, playing: false });
}

export async function GET() {
  const t0 = Date.now();
  const accountsRes = await coreFetch("/api/v1/integration_account");
  if (!accountsRes.ok) {
    console.log(
      `${TAG} accounts upstream not ok status=${accountsRes.status} elapsed=${Date.now() - t0}ms`,
    );
    return accountsRes;
  }

  const { accounts } = (await accountsRes.json()) as { accounts: Account[] };
  console.log(
    `${TAG} accounts loaded count=${accounts.length} slugs=${accounts
      .map((a) => a.integrationDefinition?.slug ?? "?")
      .join(",")}`,
  );

  const spotify = accounts.find(
    (a) => a.integrationDefinition?.slug === "spotify",
  );
  if (!spotify) {
    console.log(`${TAG} spotify NOT in connected accounts → returning connected:false`);
    return Response.json({ connected: false });
  }
  console.log(
    `${TAG} spotify account found id=${spotify.id} name=${spotify.integrationDefinition?.name ?? ""}`,
  );

  const actionRes = await coreFetch(
    `/api/v1/integration_account/${spotify.id}/action`,
    { method: "POST", body: { action: "get_currently_playing" } },
  );
  console.log(
    `${TAG} action upstream status=${actionRes.status} elapsed=${Date.now() - t0}ms`,
  );
  if (!actionRes.ok) {
    const errBody = await actionRes.clone().text().catch(() => "");
    console.log(`${TAG} action body (error): ${errBody.slice(0, 500)}`);
    return notPlaying(true);
  }

  const rawText = await actionRes.text();
  console.log(`${TAG} action raw envelope: ${rawText.slice(0, 800)}`);

  let envelope: ActionEnvelope;
  try {
    envelope = JSON.parse(rawText) as ActionEnvelope;
  } catch (e) {
    console.log(`${TAG} could not JSON.parse envelope: ${(e as Error).message}`);
    return notPlaying(true);
  }
  const text = envelope.result?.content?.[0]?.text;
  if (!text || envelope.result?.isError) {
    console.log(
      `${TAG} envelope had no text or isError=true → playing:false (isError=${envelope.result?.isError})`,
    );
    return notPlaying(true);
  }
  console.log(`${TAG} inner text (truncated): ${text.slice(0, 500)}`);

  let parsed: SpotifyCurrentlyPlaying;
  try {
    parsed = JSON.parse(text) as SpotifyCurrentlyPlaying;
  } catch (e) {
    console.log(`${TAG} could not JSON.parse inner text: ${(e as Error).message}`);
    return notPlaying(true);
  }

  const item = parsed.item;
  console.log(
    `${TAG} parsed is_playing=${parsed.is_playing} item.name=${item?.name ?? "<none>"} progress_ms=${parsed.progress_ms ?? "?"}`,
  );
  if (!parsed.is_playing || !item?.name) return notPlaying(true);

  return Response.json({
    connected: true,
    playing: true,
    track: {
      name: item.name,
      artists: (item.artists ?? [])
        .map((a) => a.name)
        .filter((n): n is string => !!n)
        .join(", "),
      album: item.album?.name ?? null,
      albumImage: item.album?.images?.[0]?.url ?? null,
      progressMs: parsed.progress_ms ?? 0,
      durationMs: item.duration_ms ?? 0,
      url: item.external_urls?.spotify ?? null,
    },
  });
}
