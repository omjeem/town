# Town Radio playlist

The Town Radio button above the BottomBar reads its tracks from this
folder. Each row maps to a slug in
`apps/web/src/ui/town-radio-tracks.ts` — drop a new MP3 in, add a row
there, and it shows up in the popover.

Current set:

| Slug                 | File                       | Title                    | Author        |
| -------------------- | -------------------------- | ------------------------ | ------------- |
| `atlas-teaser`       | `atlas-teaser.mp3`         | Atlas (Teaser)           | AtlasAudio    |
| `apalon-soundtrack`  | `apalon-soundtrack.mp3`    | Soundtrack               | ApalonBeats   |
| `fantasy-quest`      | `fantasy-quest.mp3`        | Fantasy Adventure Quest  | Alex Morgan   |
| `wonders-of-earth`   | `wonders-of-earth.mp3`     | Wonders of the Earth     | Grand Project |
| `towards-victory`    | `towards-victory.mp3`      | Towards Victory          | Pink Sound    |
| `epic-cinematic`     | `epic-cinematic.mp3`       | Cinematic Epic           | SigmaMusicArt |

All sourced from Pixabay (Pixabay Content License — free for
commercial use, no attribution required). Author names are surfaced in
the popover as a courtesy.

Missing files surface as "Track unavailable" in the popover but don't
crash the player. Removing a track = delete the row in the manifest +
delete the file; the popover updates automatically.
