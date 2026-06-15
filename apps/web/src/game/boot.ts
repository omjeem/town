// Kaplay boot — replaces the old main.ts. Now invoked from a React client
// component (TownGame.tsx) which owns the canvas and lifecycle.
//
// All sprite loads + scene registrations happen here in one call. The
// returned context is held by the React component so it can destroy the
// kaplay instance on unmount.

import kaplay from "kaplay";
import { VIEW_W, VIEW_H } from "./config";
import { registerOverworldPlotScene } from "./scenes/overworld-plot";
import { registerInteriorScene } from "./scenes/interior";

export type GameContext = ReturnType<typeof kaplay>;

// The last booted kaplay context. Held so React components outside of
// TownGame can reach into kaplay without drilling refs.
let lastContext: GameContext | null = null;

export function getKaplayContext(): GameContext | null {
  return lastContext;
}

export function bootGame(canvas: HTMLCanvasElement): GameContext {
  const k = kaplay({
    width: VIEW_W,
    height: VIEW_H,
    stretch: true,
    letterbox: true,
    crisp: true,
    pixelDensity: 1,
    // Match the getcore.me pale blue-grey wallpaper so letterbox bars vanish.
    background: "#c5d0dc",
    canvas,
  });

  // ---- LimeZu Modern Exteriors sprites. Paths are relative to /public. ----
  // Terrain.
  k.loadSprite("grass",   "/sprites/grass.png");
  k.loadSprite("grass2",  "/sprites/grass2.png");
  k.loadSprite("grass3",  "/sprites/grass3.png");
  // Trees.
  k.loadSprite("tree_a",    "/sprites/tree_a.png");
  k.loadSprite("tree_b",    "/sprites/tree_b.png");
  k.loadSprite("tree_c",    "/sprites/tree_c.png");
  k.loadSprite("tree_pine", "/sprites/tree_pine.png");
  k.loadSprite("bush",    "/sprites/bush.png");
  k.loadSprite("tuft1",   "/sprites/tuft1.png");
  k.loadSprite("tuft2",   "/sprites/tuft2.png");
  k.loadSprite("rock",    "/sprites/rock.png");
  // Pond 9-slice.
  k.loadSprite("pond_tl", "/sprites/pond_tl.png");
  k.loadSprite("pond_t",  "/sprites/pond_t.png");
  k.loadSprite("pond_tr", "/sprites/pond_tr.png");
  k.loadSprite("pond_l",  "/sprites/pond_l.png");
  k.loadSprite("pond_c",  "/sprites/pond_c.png");
  k.loadSprite("pond_r",  "/sprites/pond_r.png");
  k.loadSprite("pond_bl", "/sprites/pond_bl.png");
  k.loadSprite("pond_b",  "/sprites/pond_b.png");
  k.loadSprite("pond_br", "/sprites/pond_br.png");
  // Path autotile.
  k.loadSprite("path_tl", "/sprites/path_tl.png");
  k.loadSprite("path_t",  "/sprites/path_t.png");
  k.loadSprite("path_tr", "/sprites/path_tr.png");
  k.loadSprite("path_l",  "/sprites/path_l.png");
  k.loadSprite("path_c",  "/sprites/path_c.png");
  k.loadSprite("path_r",  "/sprites/path_r.png");
  k.loadSprite("path_bl", "/sprites/path_bl.png");
  k.loadSprite("path_b",  "/sprites/path_b.png");
  k.loadSprite("path_br", "/sprites/path_br.png");
  k.loadSprite("path_v",  "/sprites/path_v.png");
  k.loadSprite("path_h",  "/sprites/path_h.png");
  // Buildings + entities.
  k.loadSprite("home",    "/sprites/home.png");
  k.loadSprite("office",  "/sprites/office.png");
  k.loadSprite("library", "/sprites/library.png");
  k.loadSprite("store",   "/sprites/store.png");
  k.loadSprite("mailbox", "/sprites/mailbox.png");
  k.loadSprite("player",  "/sprites/player.png");
  // Founder shares the LimeZu character pack with the player + other NPCs
  // so he reads stylistically the same (16x25 character with the same
  // line work and palette). Was previously a bespoke /sprites/founder.png
  // that looked like a different game.
  k.loadSprite("founder", "/sprites/characters/office_npc.png");
  // Interior NPCs (LimeZu Modern Interiors Legacy 16x16, south-facing idle).
  k.loadSprite("home_npc",         "/sprites/characters/home_npc.png");
  k.loadSprite("office_npc",       "/sprites/characters/office_npc.png");
  k.loadSprite("library_npc",      "/sprites/characters/library_npc.png");
  k.loadSprite("store_shopkeeper", "/sprites/characters/store_shopkeeper.png");
  // Interiors.
  k.loadSprite("lib_bookshelf_wide", "/sprites/interiors/lib_bookshelf_wide.png");
  k.loadSprite("lib_bookshelf_tall", "/sprites/interiors/lib_bookshelf_tall.png");
  // HOME — single-sprite pre-built room (LimeZu Modern Interiors,
  // Generic Home 1). Credit: limezu.itch.io.
  k.loadSprite("interior_home_room", "/sprites/interiors/home/room.png");
  // OFFICE — code-composed room. Floor is one tiled sprite; props are
  // LimeZu Modern Office Revamped singles, composed in PIL into
  // "workstation" sprites (desk + monitor + chair stacked). Credit:
  // limezu.itch.io.
  k.loadSprite("office_floor",            "/sprites/interiors/office/floor.png");
  k.loadSprite("office_workstation",      "/sprites/interiors/office/workstation.png");
  k.loadSprite("office_workstation_dual", "/sprites/interiors/office/workstation_dual.png");
  k.loadSprite("office_plant_tall",       "/sprites/interiors/office/plant_tall.png");
  k.loadSprite("office_plant_snake",      "/sprites/interiors/office/plant_snake.png");
  // Store props.
  k.loadSprite("store_atm",    "/sprites/store/atm.png");
  k.loadSprite("store_booth",  "/sprites/store/booth.png");
  k.loadSprite("store_sign",   "/sprites/store/sign.png");
  k.loadSprite("store_window", "/sprites/store/sale_window.png");

  registerOverworldPlotScene(k);
  registerInteriorScene(k);
  // Plot-driven scene is the only overworld scene now. Reads from
  // /api/plot for signed-in users (poll re-renders on DB changes) and
  // falls back to @town/plot's defaultPlot for guests.
  k.go("overworld-plot");

  lastContext = k;
  return k;
}
