// The Town Radio playlist.
//
// Files live in apps/web/public/music/ keyed by slug. Drop additional
// tracks in (and add a row here) to extend the playlist — the TownRadio
// popover just iterates whatever this array contains. If a file goes
// missing the hidden <audio> fails and the popover shows a "Track
// unavailable" hint without breaking the player.

export interface RadioTrack {
  /** Slug used both as the localStorage key and the on-disk filename. */
  id: string;
  title: string;
  /** Author shown in the popover. */
  author: string;
  /** Path served from /public. */
  src: string;
}

export const TOWN_RADIO_TRACKS: readonly RadioTrack[] = [
  {
    id: "atlas-teaser",
    title: "Atlas (Teaser)",
    author: "AtlasAudio",
    src: "/music/atlas-teaser.mp3",
  },
  {
    id: "apalon-soundtrack",
    title: "Soundtrack",
    author: "ApalonBeats",
    src: "/music/apalon-soundtrack.mp3",
  },
  {
    id: "fantasy-quest",
    title: "Fantasy Adventure Quest",
    author: "Alex Morgan",
    src: "/music/fantasy-quest.mp3",
  },
  {
    id: "wonders-of-earth",
    title: "Wonders of the Earth",
    author: "Grand Project",
    src: "/music/wonders-of-earth.mp3",
  },
  {
    id: "towards-victory",
    title: "Towards Victory",
    author: "Pink Sound",
    src: "/music/towards-victory.mp3",
  },
  {
    id: "epic-cinematic",
    title: "Cinematic Epic",
    author: "SigmaMusicArt",
    src: "/music/epic-cinematic.mp3",
  },
] as const;
