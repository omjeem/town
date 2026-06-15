"use client";

import { useEffect, useRef } from "react";
import { bootGame, type GameContext } from "../game/boot";
import { refreshSession } from "../game/auth";
import { startInboxPoller } from "../game/inbox";
import { startNowPlayingPoller } from "../game/spotify";
import { startWorkspaceSync } from "../game/workspace";
import { setViewerTownSlug } from "../game/plotClient";
import { useUiState } from "./useUiStore";
import { Hud } from "./Hud";
import { InteractionPrompt } from "./InteractionPrompt";
import { Panel } from "./Panel";
import { Explorer } from "./Explorer";
import { Tasks } from "./Tasks";
import { Dialogue } from "./Dialogue";
import { Chat } from "./Chat";
import { NowPlaying } from "./NowPlaying";
import { Share } from "./Share";
import { VisitorHud } from "./VisitorHud";

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
  | { viewerMode?: "owner" }
  | {
      viewerMode: "visitor";
      townSlug: string;
      townName: string;
      visitorName: string;
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
    share,
  } = useUiState();

  const isVisitor = props.viewerMode === "visitor";

  useEffect(() => {
    if (!canvasRef.current) return;
    if (ctxRef.current) return;

    // Route plot fetches to the right town BEFORE the scene mounts.
    if (isVisitor) {
      setViewerTownSlug((props as { townSlug: string }).townSlug);
    } else {
      setViewerTownSlug(null);
    }

    ctxRef.current = bootGame(canvasRef.current);

    if (isVisitor) {
      // Visitor surfaces no owner-scoped feeds. Plot fetch goes through
      // /api/plot?town=<slug> via plotClient and that's it.
      return () => {
        ctxRef.current = null;
      };
    }

    void refreshSession();
    const stopInbox = startInboxPoller();
    const stopWorkspace = startWorkspaceSync();
    const stopNowPlaying = startNowPlayingPoller();
    return () => {
      stopInbox();
      stopWorkspace();
      stopNowPlaying();
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

      {/* Spotify card — owner only. */}
      {!isVisitor ? (
        <div className="absolute right-4 top-4 z-30">
          <NowPlaying state={nowPlaying} />
        </div>
      ) : null}

      {prompt ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-8 z-30 flex justify-center">
          <InteractionPrompt prompt={prompt} />
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
      {!isVisitor && share ? <Share /> : null}
    </div>
  );
}
