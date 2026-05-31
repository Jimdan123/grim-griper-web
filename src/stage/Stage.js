import { Container, Text } from 'pixi.js';
import { StateMachine } from '../engine/StateMachine.js';
import {
  createChapelBackground,
  createDoorArch,
  createSacristyRoom,
  createWaypointMarker,
  PALETTE,
  SCALE,
} from '../art/placeholders.js';
import {
  RENDER_MODE,
  getRenderMode,
  onRenderModeChange,
} from '../render/TileRenderer.js';

// Cross-team contract with #5 Stage + Art Lead (2026-05-30):
//   - Path: src/art/pixelPalette.js
//   - Export used here: createNaveRoomPixelArt({ tile, bounds }) → PIXI.Container
//
// #5 is authoring that module in parallel with this dispatch. To avoid a hard
// bundler failure if the module hasn't landed yet (or if #5 splits files),
// we resolve it via the cross-team pixel-art factory injection in
// setPixelArtFactories() below. Stage.js itself does NOT import pixelPalette
// directly — main.js owns that import (with a tolerant fallback) and passes
// the factory in. If the factory is missing, pixelart mode falls back to
// painterly with a console warning and the `M` toggle still works once the
// factory is wired.
let _createNaveRoomPixelArt = null;
let _createChapelFrontDoor = null;
let _createChapelCeilingPixelArt = null;
let _createChapelExteriorPixelArt = null;
let _createPixelArtConfessionRoomProps = null;
// Chapel-bustle dispatch (Stage + Art Lead, 2026-05-30 evening): warm
// midday ambient overlay + pews + side candle shrines. All pixelart-mode
// only, all optional — Stage degrades to "not mounted" if any factory is
// missing.
let _createChapelDayAmbientPixelArt = null;
let _createPewPixelArt = null;
let _createCandleShrinePixelArt = null;

/**
 * Inject #5's nave-pixel-art factory. Called once from main.js after it
 * resolves pixelPalette.js (or falls back). Stage uses whatever factory is
 * present at construction time and at each `M` toggle.
 */
export function setNaveRoomPixelArtFactory(factory) {
  _createNaveRoomPixelArt = typeof factory === 'function' ? factory : null;
}

/**
 * Inject #5's chapel-front-door factory (Stage + Art Lead, 2026-05-30).
 * The front door is rendered in the same pixel-art register as the nave —
 * it sits in the back-wall plane at the LEFT edge of chapelBounds so the
 * hooded pilgrim walks IN from outside via the entry-scene beat in main.js.
 * Mounted AFTER the nave but BEFORE the door arch / sacristy overlay so it
 * reads as part of the back wall (not floating over the sacristy room).
 *
 * Falls back to "no front door" if the factory isn't injected — the boot
 * still succeeds; the chapel just doesn't have a visible threshold.
 */
export function setChapelFrontDoorFactory(factory) {
  _createChapelFrontDoor = typeof factory === 'function' ? factory : null;
}

/**
 * Inject #5's pixel-art ceiling factory (Stage + Art Lead, 2026-05-30 evening).
 * Fills the canvas area ABOVE chapelBounds back-wall — was a black void in
 * the play-test screenshot. Falls back to "no ceiling render" if missing.
 */
export function setChapelCeilingPixelArtFactory(factory) {
  _createChapelCeilingPixelArt = typeof factory === 'function' ? factory : null;
}

/**
 * Inject #5's pixel-art exterior factory (Stage + Art Lead, 2026-05-30 evening).
 * Fills the canvas area to the LEFT of chapelBounds — the path the Reaper
 * spawns onto and walks toward the chapel door. Falls back to "no exterior".
 */
export function setChapelExteriorPixelArtFactory(factory) {
  _createChapelExteriorPixelArt = typeof factory === 'function' ? factory : null;
}

/**
 * Inject #5's pixel-art interior props composite (altar / lectern / booth /
 * sacristy details). Stage + Art Lead (2026-05-30 evening). Mounted ONLY in
 * pixelart mode so the painterly composition stays intact for A/B comparison.
 * main.js skips its own createConfessionRoomProps() mount when pixelart mode
 * is active and the factory is present.
 */
export function setPixelArtConfessionRoomPropsFactory(factory) {
  _createPixelArtConfessionRoomProps = typeof factory === 'function' ? factory : null;
}

/**
 * Inject #5's pixel-art chapel-day ambient overlay factory (Stage + Art
 * Lead, 2026-05-30 evening — chapel-bustle dispatch). Adds warm cream sun
 * shafts + chapel-wide warm wash for the day register. Pixelart-only;
 * painterly path unaffected. Optional — missing factory degrades to "no
 * day-ambient overlay rendered" with no warning (painterly path is still
 * the A/B fallback that ships intact).
 */
export function setChapelDayAmbientPixelArtFactory(factory) {
  _createChapelDayAmbientPixelArt = typeof factory === 'function' ? factory : null;
}

/**
 * Inject #5's pixel-art pew factory. Stage places 3 pews in the nave per
 * the chapel-bustle dispatch. Optional.
 */
export function setPewPixelArtFactory(factory) {
  _createPewPixelArt = typeof factory === 'function' ? factory : null;
}

/**
 * Inject #5's pixel-art candle-shrine factory. Stage places 1-2 side
 * shrines for the candlelighter NPC to attend. Optional.
 */
export function setCandleShrinePixelArtFactory(factory) {
  _createCandleShrinePixelArt = typeof factory === 'function' ? factory : null;
}

// Hybrid map (issue #22a): convert a room's tile-grid bounds (room.x/y/w/h in
// tile units) to logical-px bounds against the 1280x720 world. The tile size
// lives on stageData.meta.tile (16 by default). Pure function — no allocation
// beyond the result object. Stage uses this once per room at construction.
function roomBoundsToLogical(room, tile) {
  return {
    x: room.x * tile,
    y: room.y * tile,
    width: room.w * tile,
    height: room.h * tile,
  };
}

// 1s grace window from HAUNT.enter to victim.startRoutine() (issue 03
// "What to build" — "1s grace where he is stationary after TAB").
const HAUNT_GRACE_MS = 1000;
// Fated Death pose hold before SCORE transition (issue 03 acceptance:
// FEAR=100 → Fated Death placeholder animation → EndScreen). The Victim
// owns the 1.5s fade; Stage just waits for the onFatedDeathComplete
// callback to flip to SCORE.

export class Stage {
  constructor(data, gameState) {
    this.data = data;
    this.gameState = gameState;
    this.view = new Container();

    // Victim is injected from main.js via setVictim() so Stage doesn't have
    // to know how the walking sprite is constructed (that's #5's factory).
    // Mounting into `world` is also main.js's job — Stage just toggles the
    // victim view's visibility per FSM state.
    this.victim = null;

    // Optional listener installed by main.js for the SCORE transition.
    // Called once when Stage moves from HAUNT → SCORE with the gameState's
    // phase2EventLog so main.js can pump it through scoreRun + EndScreen.
    this._onScoreEnter = null;

    const bounds = data.chapelBounds;
    // Path A: floorY = top of the thin floor strip at the BOTTOM of chapelBounds.
    // Characters stand on this line; chapel interior fills the upper area above it.
    this.floorY = bounds.y + bounds.height - SCALE.FRAME.FLOOR_STRIP_H;

    // --- Hybrid map (#22a): multi-room rendering ---------------------------
    // Nave gets the existing createChapelBackground (full-canvas back wall +
    // pillars + floor strip — pillars sit in the nave half by composition).
    // The sacristy is a separate room mounted on top of that backdrop on the
    // right, with a door arch at the boundary.
    //
    // Both rooms share `this.floorY` so characters' feet remain on one
    // continuous ground plane — the door is a wall opening at floor level,
    // not a step up/down.
    //
    // Allocated ONCE in the constructor — no per-frame allocation. Door arch
    // and sacristy room are static Graphics primitives drawn once.
    //
    // Hot-swap (Foundation Engineer, 2026-05-30): build BOTH the painterly
    // and pixel-art nave containers at construction so the `M` debug key can
    // flip them in/out without re-constructing Stage. Only the active one is
    // added to the scene; the other is held in a field. If #5's pixel-art
    // factory hasn't been injected yet, we degrade to painterly-only and log.
    const tile = data.meta?.tile ?? 16;

    this._naveContainerPainterly = createChapelBackground(bounds);
    this._naveContainerPixelArt = _createNaveRoomPixelArt
      ? _createNaveRoomPixelArt({ tile, bounds })
      : null;
    if (
      getRenderMode() === RENDER_MODE.PIXELART &&
      !this._naveContainerPixelArt
    ) {
      // eslint-disable-next-line no-console
      console.warn(
        '[Stage] render mode is pixelart but no createNaveRoomPixelArt factory ' +
        'was injected. Falling back to painterly nave for this boot. The M ' +
        "toggle will start working once #5's pixelPalette.js lands and main.js " +
        'wires setNaveRoomPixelArtFactory().',
      );
    }

    this._activeNaveContainer =
      getRenderMode() === RENDER_MODE.PIXELART && this._naveContainerPixelArt
        ? this._naveContainerPixelArt
        : this._naveContainerPainterly;
    this.view.addChild(this._activeNaveContainer);

    // -------- Pixel-art ceiling + exterior (Stage + Art Lead, 2026-05-30 evening)
    // The user reported a black void above the chapel and an empty area to the
    // left of the door. These factories fill those bands with pixel-art
    // architecture (gothic clerestory + cobble path). Only rendered in
    // pixelart mode; painterly mode hides them (their pixel grammar would
    // clash with the painterly back wall).
    this._ceilingContainer = _createChapelCeilingPixelArt
      ? _createChapelCeilingPixelArt({ bounds })
      : null;
    if (this._ceilingContainer) {
      // Mount AFTER the nave so it sits on top of the nave's full-canvas wall
      // mass in the upper band (the nave's pixel-art wall stops at floorTopY;
      // above that the ceiling paints).
      this.view.addChild(this._ceilingContainer);
      this._ceilingContainer.visible = getRenderMode() === RENDER_MODE.PIXELART;
    }

    this._exteriorContainer = _createChapelExteriorPixelArt
      ? _createChapelExteriorPixelArt({ bounds })
      : null;
    if (this._exteriorContainer) {
      this.view.addChild(this._exteriorContainer);
      this._exteriorContainer.visible = getRenderMode() === RENDER_MODE.PIXELART;
    }

    // Subscribe to runtime mode swaps (`M` key). We swap which nave container
    // is added to this.view; ceiling / exterior / pixel-props are toggled by
    // visibility (cheaper than re-mounting). The painterly nave's full-canvas
    // wall remains in z-order beneath the pixel-art ceiling/exterior, so when
    // toggling back to painterly we hide ceiling+exterior and the painterly
    // wall mass is what shows.
    this._unsubRenderMode = onRenderModeChange((next) => {
      const target =
        next === RENDER_MODE.PIXELART && this._naveContainerPixelArt
          ? this._naveContainerPixelArt
          : this._naveContainerPainterly;
      if (target !== this._activeNaveContainer) {
        this.view.removeChild(this._activeNaveContainer);
        this._activeNaveContainer = target;
        this.view.addChildAt(target, 0);
      }
      const pixel = next === RENDER_MODE.PIXELART;
      if (this._ceilingContainer) this._ceilingContainer.visible = pixel;
      if (this._exteriorContainer) this._exteriorContainer.visible = pixel;
      if (this._pixelPropsContainer) this._pixelPropsContainer.visible = pixel;
      // Chapel-bustle dispatch — chapel-day ambient + pews + shrines visibility
      // follows the same pixelart-only rule as the other pixel-art mounts.
      if (this._dayAmbientContainer) this._dayAmbientContainer.visible = pixel;
      if (this._pewsContainer) this._pewsContainer.visible = pixel;
    });
    // -------- Chapel front door (Stage + Art Lead, 2026-05-30) --------
    // The hooded pilgrim walks INTO the chapel from outside on boot — this
    // is the visible threshold they cross. Mounted AFTER the nave so it sits
    // on the back-wall plane, but BEFORE the sacristy overlay + door arch so
    // those continue to paint over it on the right side.
    //
    // Render mode: this pivot is locked to the pixel-art register. The front
    // door is part of #5's pixel-art chapel staging and only renders when
    // the factory has been injected by main.js. Painterly path keeps the old
    // door-less left edge — acceptable since the dispatch authors pixel-art
    // as the staged register the user actually plays.
    if (_createChapelFrontDoor) {
      this._frontDoorContainer = _createChapelFrontDoor({ bounds });
      this.view.addChild(this._frontDoorContainer);
    }

    const rooms = Array.isArray(data.rooms) ? data.rooms : [];
    const sacristyRoom = rooms.find((r) => r.id === 'sacristy');
    if (sacristyRoom) {
      const sacBounds = roomBoundsToLogical(sacristyRoom, tile);
      // Sacristy room paint — a slightly darker / browner back wall mass and
      // a small storage prop. Sits ON TOP of the nave's chapel background so
      // it visually replaces that region (the chapel backdrop was full-canvas;
      // the sacristy overlay redresses the right side as a deeper room).
      //
      // Render-mode gate (2026-05-30 evening) — user reported the sacristy
      // section "looks like it got cut out and out of the background" because
      // the painterly sacristy patch clashed against the pixel-art nave.
      // In PIXELART mode the pixel-art nave already extends across the full
      // canvas width and the pixel-art sacristy details (urn shelf, brick
      // niche) are drawn separately via createPixelArtConfessionRoomProps,
      // so the painterly sacristy overlay is unnecessary AND wrong-register.
      // Skip it entirely in pixel-art mode; painterly mode keeps it for A/B.
      if (getRenderMode() !== RENDER_MODE.PIXELART) {
        this.view.addChild(createSacristyRoom(sacBounds));
      }
    }

    // Door arch — a vertical wood-toned frame at the door tile, with a gap
    // for the opening. links[0] is the nave→sacristy door for stage 1 MVP.
    const doorLink = Array.isArray(data.links)
      ? data.links.find((l) => l.type === 'door' && l.label === 'sacristy_door')
      : null;
    if (doorLink) {
      const [tx, ty] = doorLink.tile;
      void ty; // door height is anchored to chapelBounds top↓floor; ty unused for now.
      const doorLogicalX = tx * tile;
      this.view.addChild(
        createDoorArch({
          tileLogicalX: doorLogicalX,
          topY: bounds.y,
          floorY: this.floorY,
        }),
      );
    }

    // Waypoint markers removed 2026-05-30 evening per user direction during
    // the Happy Hills pivot: "why is there way points?". The waypoint DATA
    // (position + id + kind) stays in confession-room.json because the Victim
    // routine walker still uses it as anchor positions, but the floor-level
    // color-coded markers no longer render. The day-phase chapel should read
    // as an actual chapel a hooded pilgrim walks into — not a puzzle board
    // with labelled stops. Evidence discovery + room exploration drive the
    // player's understanding of layout instead.
    void createWaypointMarker;

    // -------- Chapel-day ambient overlay (chapel-bustle, 2026-05-30 evening)
    // Warm cream sun shafts + chapel-wide warm wash + floor brightening. The
    // chapel reads as a working church at midday rather than a dim stone box.
    // Mounted BEFORE the interior props so altar/lectern/booth still paint
    // crisply on top (the wash lifts the walls + floor, not the prop edges).
    // Pixelart-only — painterly path retains its existing register intact.
    this._dayAmbientContainer = _createChapelDayAmbientPixelArt
      ? _createChapelDayAmbientPixelArt({ bounds })
      : null;
    if (this._dayAmbientContainer) {
      this.view.addChild(this._dayAmbientContainer);
      this._dayAmbientContainer.visible = getRenderMode() === RENDER_MODE.PIXELART;
    }

    // -------- Pixel-art interior props (Stage + Art Lead, 2026-05-30 evening)
    // The painterly props (createConfessionRoomProps) clashed hard with the
    // pixel-art back wall in the play-test screenshot: altar/lectern/booth/
    // sacristy props all painterly while walls were pixel-art. We mount the
    // pixel-art equivalents here ONLY when render mode is PIXELART, and
    // main.js skips its painterly mount so they don't double-stack.
    //
    // Mounted AFTER the sacristy + door arch so props sit ON TOP of the
    // back wall, but BEFORE the gameplay midground (ghosts/evidence/player)
    // which main.js mounts onto `world` (not `stage.view`).
    this._pixelPropsContainer = _createPixelArtConfessionRoomProps
      ? _createPixelArtConfessionRoomProps({ floorY: this.floorY })
      : null;
    if (this._pixelPropsContainer) {
      this.view.addChild(this._pixelPropsContainer);
      this._pixelPropsContainer.visible = getRenderMode() === RENDER_MODE.PIXELART;
    }

    // -------- Pews + side candle shrines (chapel-bustle, 2026-05-30 evening)
    // Three pews positioned in the nave between the altar / lectern / booth
    // diegetic anchors so parishioner-kneeler NPCs have something to kneel
    // in front of. Two side shrines flank the chapel — one near the altar's
    // left side, one further down the nave — so the candlelighter NPC has a
    // canonical spot. All pixelart-only; painterly path is unchanged.
    this._pewsContainer = null;
    this._shrinesContainer = null;
    if (_createPewPixelArt || _createCandleShrinePixelArt) {
      this._pewsContainer = new Container();
      this._pewsContainer.label = 'pews-shrines-pixel';
      // Pews — three across the nave. Positions chosen to read clearly with
      // the existing altar (x=220) / lectern (x=500) / booth (x=780) layout:
      // pews sit BETWEEN those anchors so they don't fight the prop silhouettes.
      const pewXs = [360, 640, 920];
      if (_createPewPixelArt) {
        for (const px of pewXs) {
          this._pewsContainer.addChild(
            _createPewPixelArt({ x: px, floorY: this.floorY }),
          );
        }
      }
      // Side candle shrines — two. One left of altar (x=130 — between the
      // door and the altar), one between lectern and booth (x=660). These
      // are where the candlelighter NPC stands.
      if (_createCandleShrinePixelArt) {
        const shrineXs = [130, 660];
        for (const sx of shrineXs) {
          this._pewsContainer.addChild(
            _createCandleShrinePixelArt({ x: sx, floorY: this.floorY }),
          );
        }
      }
      this.view.addChild(this._pewsContainer);
      this._pewsContainer.visible = getRenderMode() === RENDER_MODE.PIXELART;
    }

    // Phase 2 placeholder Text — sits near the top of the chapel interior so
    // the user can see TAB worked. Hidden until HAUNT enter.
    this._haunt_placeholder = new Text({
      text: 'Phase 2 — slice 3',
      style: {
        fontFamily: 'sans-serif',
        fontSize: 28,
        fill: PALETTE.WAYPOINT_LABEL,
        align: 'center',
      },
    });
    this._haunt_placeholder.anchor.set(0.5, 0);
    this._haunt_placeholder.x = bounds.x + bounds.width / 2;
    this._haunt_placeholder.y = bounds.y + 24;
    this._haunt_placeholder.visible = false;
    this.view.addChild(this._haunt_placeholder);

    // Grace timer for the 1s post-TAB stationary window.
    this._hauntGraceElapsedMs = 0;
    this._routineStarted = false;

    this.phase = new StateMachine(
      {
        INVESTIGATION: {
          enter: () => {},
          update: () => {},
          exit: () => {},
        },
        HAUNT: {
          enter: () => {
            this._haunt_placeholder.visible = true;
            this._hauntGraceElapsedMs = 0;
            this._routineStarted = false;
            if (this.victim) {
              this.victim.view.visible = true;
            }
            // eslint-disable-next-line no-console
            console.log('[Stage] phase → HAUNT (slice 3)');
          },
          update: (dtMs) => {
            // Tick FEAR=100 check FIRST so a haunt landed mid-grace still
            // counts (it shouldn't be possible — input handlers gate on phase
            // being HAUNT — but harmless to check either way).
            if (
              this.gameState &&
              this.gameState.fear >= 100 &&
              !this.phase.is('SCORE')
            ) {
              this.phase.transition('SCORE');
              return;
            }

            if (!this._routineStarted) {
              this._hauntGraceElapsedMs += dtMs;
              if (this._hauntGraceElapsedMs >= HAUNT_GRACE_MS) {
                this._routineStarted = true;
                if (this.victim) this.victim.startRoutine();
              }
            }

            if (this.victim) this.victim.update(dtMs);
          },
          exit: () => {
            this._haunt_placeholder.visible = false;
          },
        },
        SCORE: {
          enter: () => {
            // Fated Death pose + fade. Victim handles its own ~1.5s fade and
            // fires onFatedDeathComplete; Stage forwards that to main.js via
            // _onScoreEnter, which shows the EndScreen overlay.
            if (this.victim) this.victim.enterFatedDeath();
            // We don't call _onScoreEnter right here — we wait for the Fated
            // Death fade to finish (Victim invokes onFatedDeathComplete which
            // is wired in main.js to fire EndScreen). Stage's job is to flip
            // FSM state and stop further input from reaching HAUNT handlers.
          },
          update: (dtMs) => {
            // Still tick Victim so its fade animation runs.
            if (this.victim) this.victim.update(dtMs);
          },
          exit: () => {},
        },
      },
      'INVESTIGATION',
    );
  }

  /**
   * Wire the Victim instance built by main.js. Called once after construction,
   * before the GameLoop starts. Stage owns the lifecycle (start routine,
   * enter Fated Death) but main.js owns mounting victim.view into `world`.
   */
  setVictim(victim) {
    this.victim = victim;
    // Hide until HAUNT.enter — we don't want Aldric visible during
    // INVESTIGATION phase. Visibility is flipped in HAUNT.enter.
    if (this.victim && this.victim.view) {
      this.victim.view.visible = false;
    }
  }

  /**
   * Register a callback fired once when Stage transitions to SCORE.
   * main.js uses this to invoke scoreRun + endScreen.show. Not the Victim's
   * fade callback — that one is wired separately in main.js as the Victim's
   * onFatedDeathComplete.
   */
  onScoreEnter(cb) {
    this._onScoreEnter = cb;
  }

  /**
   * Bridge for main.js: when the Victim's Fated Death fade completes,
   * notify the SCORE-enter listener so the EndScreen comes up.
   */
  notifyFatedDeathComplete() {
    if (this._onScoreEnter) this._onScoreEnter();
  }

  tryAdvancePhase() {
    if (!this.phase.is('INVESTIGATION')) return false;
    if (!this.gameState || this.gameState.collectedEvidence.size < 4) return false;
    this.phase.transition('HAUNT');
    return true;
  }

  update(dtMs) {
    this.phase.update(dtMs);
  }
}
