"use client";

import { useEffect, useRef } from "react";
import { bootGame, type GameContext } from "../game/boot";
import { refreshSession } from "../game/auth";
import { startInboxPoller } from "../game/inbox";
import { startNowPlayingPoller } from "../game/spotify";
import { startSuggestionsPoller } from "../game/suggestions";
import { startWorkspaceSync } from "../game/workspace";
import { setViewerTownSlug } from "../game/plotClient";
import { setPlayerCharacter } from "../game/character";
import { startRealtime, type RealtimeHandle } from "../game/realtime";
import { startPendingPoller } from "../game/dmPending";
import { OWNER_DEFAULT_CHARACTER } from "../lib/characters";
import { useUiState } from "./useUiStore";
import { Hud } from "./Hud";
import { InteractionPrompt } from "./InteractionPrompt";
import { Panel } from "./Panel";
import { Explorer } from "./Explorer";
import { Tasks } from "./Tasks";
import { Dialogue } from "./Dialogue";
import { Chat } from "./Chat";
import { NowPlaying } from "./NowPlaying";
import { Invite } from "./Invite";
import { ShareImage } from "./ShareImage";
import { Suggestions } from "./Suggestions";
import { Dm } from "./Dm";
import { RemoteCards } from "./RemoteCards";
import { VisitorHud } from "./VisitorHud";
import { PALETTE } from "../game/config";
import { ui } from "./store";

// The mount point: a canvas owned by React, populated by kaplay in useEffect,
// and a sibling overlay layer for the React-rendered UI (HUD, prompt, panels).
//
// `viewerMode` switches the page between owner-mode (full feature set) and
// visitor-mode (read-only canvas of someone else's town):
//   • owner    — what was here before. Boots pollers + own-plot fetch.
//   • visitor  — points plotClient at /api/plot?town=<slug>, skips the
//                owner-only pollers (inbox / spotify / workspace).
//
// Owner is the default so the existing root `/` page keeps working
// unchanged.
export type TownGameProps =
  | {
      viewerMode?: "owner";
      ownerCharacter?: string;
      // Omitted only when rendering the guest playground at `/` — that
      // path has no Town and no realtime.
      townSlug?: string;
    }
  | {
      viewerMode: "visitor";
      townSlug: string;
      townName: string;
      visitorName: string;
      visitorCharacter: string;
    };

export function TownGame(props: TownGameProps = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<GameContext | null>(null);
  const {
    hud,
    prompt,
    panel,
    explorer,
    tasks,
    dialogue,
    chat,
    inbox,
    nowPlaying,
    invite,
    shareImage,
    proximity,
    dm,
    suggestions,
  } = useUiState();

  const isVisitor = props.viewerMode === "visitor";

  useEffect(() => {
    if (!canvasRef.current) return;
    if (ctxRef.current) return;

    // Route plot fetches + pick the player sprite BEFORE the scene mounts.
    if (isVisitor) {
      const v = props as { townSlug: string; visitorCharacter: string };
      setViewerTownSlug(v.townSlug);
      setPlayerCharacter(v.visitorCharacter);
    } else {
      const o = props as { ownerCharacter?: string };
      setViewerTownSlug(null);
      setPlayerCharacter(o.ownerCharacter ?? OWNER_DEFAULT_CHARACTER);
    }

    ctxRef.current = bootGame(canvasRef.current);

    if (isVisitor) {
      // Visitor: skip owner-scoped pollers, but still join the realtime
      // bus so they see (and are seen by) the owner + other visitors.
      const slug = (props as { townSlug: string }).townSlug;
      let visitorRt: RealtimeHandle | null = null;
      void startRealtime({ slug }).then((handle) => {
        visitorRt = handle;
      });
      const stopPending = startPendingPoller(slug);
      return () => {
        visitorRt?.stop();
        stopPending();
        ctxRef.current = null;
      };
    }

    void refreshSession();
    const stopInbox = startInboxPoller();
    const stopWorkspace = startWorkspaceSync();
    const stopNowPlaying = startNowPlayingPoller();
    const stopSuggestions = startSuggestionsPoller();

    let rt: RealtimeHandle | null = null;
    let stopPending: (() => void) | null = null;
    const ownerSlug = (props as { townSlug?: string }).townSlug;
    if (ownerSlug) {
      void startRealtime({ slug: ownerSlug }).then((handle) => {
        rt = handle;
      });
      stopPending = startPendingPoller(ownerSlug);
    }
    return () => {
      stopInbox();
      stopWorkspace();
      stopNowPlaying();
      stopSuggestions();
      rt?.stop();
      stopPending?.();
      ctxRef.current = null;
    };
  }, [isVisitor, props]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#0e1116]">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        style={{ imageRendering: "pixelated" }}
      />

      {/* React-rendered cards floating above each remote player. Picks
          up positions from kaplay via the projection helper. */}
      <RemoteCards canvasRef={canvasRef} />

      {/* HUD — owner-mode renders the identity badge; visitor-mode renders
          the "Visiting X" card. */}
      {isVisitor ? (
        <div className="pointer-events-auto absolute left-4 top-4 z-30">
          <VisitorHud
            townName={(props as { townName: string }).townName}
            visitorName={(props as { visitorName: string }).visitorName}
            townSlug={(props as { townSlug: string }).townSlug}
          />
        </div>
      ) : hud ? (
        <div className="pointer-events-auto absolute left-4 top-4 z-30">
          <Hud hud={hud} inbox={inbox} />
        </div>
      ) : null}

      {/* Spotify card + Suggestions badge stack — owner only. Suggestions
          first so it sits at the top-right corner where the user expects
          a notifications affordance. */}
      {!isVisitor ? (
        <div className="pointer-events-auto absolute right-4 top-4 z-30 flex flex-col items-end gap-2">
          <SuggestionsBadge count={suggestions.count} />
          <NowPlaying state={nowPlaying} />
        </div>
      ) : null}

      {prompt ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-8 z-30 flex justify-center">
          <InteractionPrompt prompt={prompt} />
        </div>
      ) : proximity ? (
        // Bottom-center prompt for the closest nearby player. Same vocab
        // as the building-interaction prompts so SPACE always means the
        // same thing visually.
        <div className="pointer-events-none absolute inset-x-0 bottom-8 z-30 flex justify-center">
          <InteractionPrompt
            prompt={{
              label: `SPACE to talk to ${proximity.name}`,
              accent: "#1db954",
            }}
          />
        </div>
      ) : null}

      {/* All modal overlays remain rendered. Visitor's underlying API calls
          will 401/403 — fine for the initial cut; we'll tighten later by
          gating these on viewerMode. */}
      {panel ? <Panel panel={panel} /> : null}
      {explorer ? <Explorer /> : null}
      {tasks ? <Tasks /> : null}
      {dialogue ? <Dialogue dialogue={dialogue} /> : null}
      {chat ? <Chat chat={chat} /> : null}
      {!isVisitor && invite ? <Invite /> : null}
      {!isVisitor && shareImage ? <ShareImage /> : null}
      {!isVisitor && suggestions.open ? (
        <Suggestions list={suggestions.list} />
      ) : null}
      {dm ? (
        <Dm
          townSlug={dm.townSlug}
          otherKey={dm.otherKey}
          otherName={dm.otherName}
        />
      ) : null}
    </div>
  );
}

// Top-right pill: 🛎 + count. Renders nothing when count = 0 so the corner
// stays quiet until the butler actually has something to propose.
function SuggestionsBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <button
      type="button"
      onClick={() => ui.openSuggestions()}
      className="nb-card flex items-center gap-2 px-3 py-2 text-left"
      style={{ background: PALETTE.h60, color: "#1a1d22" }}
      title="Open suggestions"
      aria-label={`${count} suggestion${count === 1 ? "" : "s"} waiting`}
    >
      <span aria-hidden className="text-base leading-none">
        🛎
      </span>
      <span className="text-[12px] font-bold leading-tight">
        {count === 1 ? "1 suggestion" : `${count} suggestions`}
      </span>
    </button>
  );
}
