"use client";

import type { NowPlayingState } from "./store";

// Floating "now playing" card. Renders nothing unless Spotify is connected
// in CORE and a track is currently playing. Same neobrutalism vocabulary
// as the rest of the HUD (thick border + offset shadow + paper fill).
export function NowPlaying({ state }: { state: NowPlayingState }) {
  if (!state.connected || !state.playing || !state.track) return null;
  const { name, artists, progressMs, durationMs, albumImage, url } =
    state.track;
  const pct =
    durationMs > 0 ? Math.min(100, (progressMs / durationMs) * 100) : 0;

  const card = (
    <div className="nb-card flex w-72 items-center gap-3 px-3 py-2">
      {albumImage ? (
        // External Spotify CDN — plain <img>, not next/image, to skip
        // the remotePatterns config dance for a tiny 64px thumbnail.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={albumImage}
          alt=""
          className="nb-tile h-12 w-12 shrink-0 object-cover"
        />
      ) : (
        <div
          className="nb-tile flex h-12 w-12 shrink-0 items-center justify-center text-lg font-black"
          style={{ background: "#1db954", color: "var(--ink)" }}
        >
          ♫
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="truncate text-sm font-bold leading-tight text-ink">
          {name}
        </div>
        <div className="truncate text-[11px] leading-tight text-ink opacity-60">
          {artists}
        </div>
        <div className="mt-1 h-1 w-full bg-black/10">
          <div
            className="h-full"
            style={{ width: `${pct}%`, background: "#1db954" }}
          />
        </div>
      </div>
    </div>
  );

  if (!url) return card;
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="pointer-events-auto block"
      title="Open in Spotify"
    >
      {card}
    </a>
  );
}
