// decor.js — decorative composition props (foreground, signage, lighting, stained window, vignette).
// Split from src/art/placeholders.js per refactor issue #1 Phase 2b.

import { Container, Graphics } from 'pixi.js';
import { PALETTE, SCALE, CANVAS } from './constants.js';

export function createConfessionRoomForeground() {
  const container = new Container();
  container.label = 'confession-room-foreground';

  const dark = PALETTE.COMPOSITION.FOREGROUND_SILHOUETTE;
  // Foreground budget: <= 14% of canvas width (tightened from 18%).
  // Canvas is 1280, so we hold the silhouette within x ∈ [0, ~180].

  // ONE silhouette: a tall narrow vertical mass on the far-left edge that
  // reads as "the edge of a pew / pillar / doorframe we are peering past".
  // No arms, no ornament, no second prop. Just one continuous dark wedge
  // cutting in from the canvas edge.
  const silhouette = new Graphics();
  silhouette
    .poly([
      0, 0,           // top-left corner of canvas
      90, 0,          // narrow at top
      60, CANVAS.HEIGHT,  // tapers slightly inward toward bottom
      0, CANVAS.HEIGHT,   // bottom-left corner
    ])
    .fill(dark);
  container.addChild(silhouette);

  return container;
}

/**
 * Small subtle cross plaque — stage-identifier that reads at thumbnail.
 * Redo pass: shrunk from 60x88 to 40x56 (≤ 120px-wide spec margin) and
 * stripped the warm catchlight (the lighting accent it referenced is gone).
 * Foundation should reposition this to upper-RIGHT (opposite the stained
 * window anchor) so it doesn't cluster with the window in the upper-left.
 *
 * Total bounding box ~ 40 wide x 60 tall. Caller places top-left at desired
 * spot (e.g. upper-right: roughly (CANVAS.WIDTH - 80, 30)).
 */
export function createConfessionRoomSignage() {
  const container = new Container();
  container.label = 'confession-room-signage';

  const stone = PALETTE.COMPOSITION.CROSS_PLAQUE;

  // Small hanging chain stub (two pixels of darker tone above the plaque).
  const chain = new Graphics();
  chain.rect(19, 0, 2, 6).fill(PALETTE.COMPOSITION.FOREGROUND_SILHOUETTE);
  container.addChild(chain);

  // Plaque background — modest carved-stone rect, half the previous size.
  const plaque = new Graphics();
  plaque.rect(0, 6, 40, 54).fill(stone);
  container.addChild(plaque);

  // Cross — vertical bar + horizontal cross-bar inside the plaque.
  // Thinner strokes match the smaller plaque.
  const cross = new Graphics();
  cross.rect(19, 14, 2, 38).fill(PALETTE.WAYPOINT_LABEL);
  cross.rect(11, 24, 18, 2).fill(PALETTE.WAYPOINT_LABEL);
  container.addChild(cross);

  return container;
}

/**
 * DEPRECATED in redo pass. The previous implementation rendered a large
 * literal warm rectangle in the upper-left that competed with the signage
 * and stained window for the same compositional anchor. Happy Hills uses
 * ONE light source per scene, expressed diegetically (warm pane of a window),
 * not a free-floating bloom on the wall.
 *
 * Returns an empty Container so existing Foundation wiring keeps working
 * until Foundation removes the addChild call. The chapel's candlelit feel
 * now comes from the stained-window glow + vignette tonal grading alone.
 *
 * TODO Foundation follow-up: stop calling this and remove the import.
 */
export function createLightingAccent() {
  const container = new Container();
  container.label = 'lighting-accent-deprecated';
  return container;
}

/**
 * Tall stained-window silhouette to sit behind the Altar waypoint. This is
 * now the chapel's PRIMARY stage-identifier (the signage having been demoted
 * and the lighting accent deleted). It carries two compositional jobs:
 *   1. Stage identity — the warm pane reads "this is a chapel" at thumbnail.
 *   2. Implied light source — the warm glow plays the role the deleted
 *      lightingAccent used to do, but diegetically (light through window).
 *
 * Redo pass: widened from 60 to 80 (more compositional weight) and bumped
 * pane alpha from 0.55 to 0.72 so the warm glow does the work the deleted
 * lightingAccent used to do (diegetically, through the window). Height
 * kept at 180 to avoid colliding with the Altar waypoint marker below, since
 * Foundation positions this container at a fixed y on the back wall.
 *
 * Total bounding box: 80 wide x 180 tall. Caller places top-left at desired
 * spot (typically y ~ 300, x ~ Altar waypoint x minus W/2).
 */
export function createStainedWindowSilhouette() {
  const container = new Container();
  container.label = 'stained-window';

  const frame = PALETTE.CHAPEL_FRAME;
  const glow = PALETTE.COMPOSITION.STAINED_WINDOW_GLOW;

  const W = 80;
  const H = 180;

  // Outer frame — dark stone surround.
  const outer = new Graphics();
  outer.rect(0, 0, W, H).fill(frame);
  container.addChild(outer);

  // Inner warm pane — inset, brighter than before so the window carries the
  // role of the deleted lighting accent.
  const pane = new Graphics();
  pane.rect(10, 12, W - 20, H - 24).fill(glow);
  pane.alpha = 0.72;
  container.addChild(pane);

  // Cross-mullion (vertical + horizontal divider).
  const mullion = new Graphics();
  mullion.rect(W / 2 - 2, 12, 4, H - 24).fill(frame);
  mullion.rect(10, H / 2 - 2, W - 20, 4).fill(frame);
  container.addChild(mullion);

  return container;
}

/**
 * Four-side edge-darken vignette overlay. Each side is implemented as 3
 * stepped-alpha rects to approximate a soft gradient (PIXI Graphics does not
 * give us a free radial). Bottom corners get extra alpha — the player is
 * peering down into the chapel (Part B.1 §7).
 *
 * Caller mounts this on app.stage (NOT world) so it sits above everything
 * including any UI candidates. addChild last.
 *
 * Redo pass: returns a Container with a `resize(viewW, viewH)` method
 * attached so Foundation can call it on `window.resize`. Initial draw uses
 * the canvas defaults; resize() rebuilds all rects to the new viewport so
 * the vignette tracks the actual rendered canvas size rather than the
 * logical CANVAS.WIDTH/HEIGHT.
 *
 * Contract for Foundation:
 *   const vignette = createVignette();
 *   app.stage.addChild(vignette);
 *   window.addEventListener('resize', () =>
 *     vignette.resize(window.innerWidth, window.innerHeight)
 *   );
 *   // Also call once after mount in case initial viewport != 1280x720:
 *   vignette.resize(window.innerWidth, window.innerHeight);
 */
export function createVignette() {
  const container = new Container();
  container.label = 'vignette';

  const dark = PALETTE.COMPOSITION.VIGNETTE;

  const draw = (W, H) => {
    // Clear any previously-drawn band rects before re-drawing for new size.
    container.removeChildren();

    // QA Bug 7 fix (2026-05-30 evening) — both the original 3-stripe stepped
    // approach AND the 24-stripe gradient approach showed visible banding
    // seams in capture and on-screen. Replaced with the SIMPLEST possible
    // edge-darken: one solid rect per side at low alpha. Loses the smooth
    // gradient falloff but is COMPLETELY artifact-free at any viewport size.
    // The chapel art + scene composition carry the focal weight; the vignette
    // is just a subtle edge frame.

    const HORIZ_BAND = Math.round(H * 0.12);
    const VERT_BAND = Math.round(W * 0.08);

    // Single top rect.
    const top = new Graphics();
    top.rect(0, 0, W, HORIZ_BAND).fill(dark);
    top.alpha = 0.4;
    container.addChild(top);

    // Single bottom rect — slightly darker.
    const bottom = new Graphics();
    bottom.rect(0, H - HORIZ_BAND, W, HORIZ_BAND).fill(dark);
    bottom.alpha = 0.5;
    container.addChild(bottom);

    // Single left rect.
    const left = new Graphics();
    left.rect(0, 0, VERT_BAND, H).fill(dark);
    left.alpha = 0.35;
    container.addChild(left);

    // Single right rect.
    const right = new Graphics();
    right.rect(W - VERT_BAND, 0, VERT_BAND, H).fill(dark);
    right.alpha = 0.35;
    container.addChild(right);
  };

  // Initial draw at logical canvas size; Foundation should call resize()
  // after mount and on every window resize to track the real viewport.
  draw(CANVAS.WIDTH, CANVAS.HEIGHT);

  container.resize = (viewW, viewH) => {
    draw(viewW, viewH);
  };

  return container;
}

// ---------------------------------------------------------------------------
// Aldric portrait card (slice "show me who you're hunting")
// ---------------------------------------------------------------------------
// A small corner card that reads "Father Aldric, present in spirit during
// Phase 1". The real walking Aldric ships in slice 3; this placeholder lets
// the player see the target's face while they collect evidence.
//
// Design intent:
//   * Same shape grammar as the ghost priest figure (round head, collar band,
//     vestment body) — that consistency makes the ghosts read as "ALDRIC
//     re-enacting his own crime", not as victims.
//   * Inverted palette from the ghosts/Reaper: WARM CREAM (ALDRIC_BODY /
//     ALDRIC_HEAD), full alpha. The warmth makes Aldric read as ALIVE and
//     in the present — distinct from the cold-cyan witnesses and the
//     near-black Reaper.
//   * Framed like a card (carved stone frame + dim back-pane vignette), so
//     it reads as a UI artifact, not a sprite running around the world.
//   * Returns a PIXI.Container — UI/HUD owns positioning on app.stage.

